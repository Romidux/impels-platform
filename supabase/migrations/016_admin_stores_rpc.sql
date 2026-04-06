-- ================================================================
-- Migration 016: Admin stores RPC (filtered, sorted, paginated)
-- ================================================================
-- Purpose:
--   Replace the double full-table fetch (all stores + all orders)
--   in admin/stores/page.tsx with a single parametric SQL function
--   that handles search, filtering, sorting and pagination entirely
--   in the database.
--
-- Why a function is necessary (not just .range()):
--   · "activity" filters (no-orders, no-recent, recent) require a
--     JOIN with aggregated order data — impossible with the Supabase
--     JS query builder alone.
--   · "orders" and "revenue" sort options need GROUP BY aggregation.
--     Paginating first and then sorting in JS would sort only the
--     current page, breaking the feature entirely.
--
-- Return shape:
--   {
--     totals:         { total_stores, active_stores, inactive_stores,
--                       no_orders_stores, no_recent_stores }   -- always ALL stores
--     filtered_count: number                                   -- for subtitle + pages
--     stores:         StoreRow[]                               -- current page
--   }
--
-- Design decisions (same rationale as migration 015):
--   · SECURITY INVOKER + REVOKE/GRANT — service_role already bypasses RLS.
--   · SET search_path = public — prevents search-path injection.
--   · RETURNS jsonb — binary, consistent with PostgREST internals.
--   · status != 'cancelled' — safe; orders.status is NOT NULL + CHECK.
--   · "new store" = created_at >= date_trunc('month', now()) (calendar month).
--   · Dynamic sort via multiple CASE expressions — each activates one
--     sort criterion; the others evaluate to NULL (NULLS LAST = ignored).
--     Timestamps converted to epoch so all numeric cases share a type.
--   · id as final tiebreaker — deterministic on exact-timestamp ties.
--
-- Caller:  Server-only via createAdminClient() (service_role key).
-- ================================================================

CREATE OR REPLACE FUNCTION get_admin_stores(
  p_q         text  DEFAULT NULL,
  p_status    text  DEFAULT 'all',
  p_segment   text  DEFAULT 'all',
  p_activity  text  DEFAULT 'all',
  p_sort      text  DEFAULT 'newest',
  p_page      int   DEFAULT 1,
  p_page_size int   DEFAULT 25
)
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  WITH store_order_stats AS (
    -- Single-pass aggregation of all non-cancelled orders.
    SELECT
      store_id,
      count(*)::int                                                          AS total_orders,
      coalesce(sum(total), 0)                                                AS total_revenue,
      count(*) FILTER (WHERE created_at > now() - interval '30 days')::int  AS orders_last_30d,
      max(created_at)                                                        AS last_order_at
    FROM orders
    WHERE status != 'cancelled'
    GROUP BY store_id
  ),
  enriched AS (
    -- Join stores with their order stats once. All order columns
    -- coalesce to 0/NULL so downstream CTEs never see NULLs for counts.
    SELECT
      s.id,
      s.name,
      s.slug,
      s.plan,
      s.is_active,
      s.created_at,
      coalesce(sos.total_orders,    0)  AS total_orders,
      coalesce(sos.total_revenue,   0)  AS total_revenue,
      coalesce(sos.orders_last_30d, 0)  AS orders_last_30d,
      sos.last_order_at,                -- NULL = store has no orders (intentional)
      (s.created_at >= date_trunc('month', now())) AS is_new_store
    FROM stores s
    LEFT JOIN store_order_stats sos ON sos.store_id = s.id
  ),
  -- ── Global totals (always over ALL stores, never the filtered subset) ──
  global_totals AS (
    SELECT
      count(*)::int                                           AS total_stores,
      count(*) FILTER (WHERE is_active = true)::int          AS active_stores,
      count(*) FILTER (WHERE is_active = false)::int         AS inactive_stores,
      count(*) FILTER (WHERE total_orders    = 0)::int       AS no_orders_stores,
      count(*) FILTER (WHERE orders_last_30d = 0)::int       AS no_recent_stores
    FROM enriched
  ),
  -- ── Apply all active filters ──────────────────────────────────────────
  filtered AS (
    SELECT *
    FROM enriched
    WHERE
      -- Text search (name or slug, case-insensitive)
      (p_q IS NULL OR p_q = ''
        OR name ILIKE '%' || p_q || '%'
        OR slug ILIKE '%' || p_q || '%')
      -- Status filter
      AND (p_status = 'all'
        OR (p_status = 'active'   AND is_active = true)
        OR (p_status = 'inactive' AND is_active = false))
      -- Segment filter
      AND (p_segment = 'all'
        OR (p_segment = 'new' AND is_new_store = true))
      -- Activity filter
      AND (p_activity = 'all'
        OR (p_activity = 'no-orders' AND total_orders    = 0)
        OR (p_activity = 'no-recent' AND orders_last_30d = 0)
        OR (p_activity = 'recent'    AND orders_last_30d > 0))
  ),
  -- ── Count filtered results (before pagination) ───────────────────────
  filtered_count AS (
    SELECT count(*)::int AS n FROM filtered
  ),
  -- ── Sort and paginate ─────────────────────────────────────────────────
  -- Dynamic sort: each CASE evaluates to the sort column value for the
  -- matching p_sort, and to NULL for all others. NULLS LAST ensures
  -- inactive cases don't affect the order. All timestamp columns are
  -- cast to epoch (numeric) so their CASE expressions share a type with
  -- the other numeric sorts and can safely coexist in the same ORDER BY.
  paginated AS (
    SELECT *
    FROM filtered
    ORDER BY
      CASE WHEN p_sort = 'newest'     THEN extract(epoch FROM created_at)    END DESC NULLS LAST,
      CASE WHEN p_sort = 'oldest'     THEN extract(epoch FROM created_at)    END ASC  NULLS LAST,
      CASE WHEN p_sort = 'orders'     THEN total_orders::numeric             END DESC NULLS LAST,
      CASE WHEN p_sort = 'revenue'    THEN total_revenue                     END DESC NULLS LAST,
      CASE WHEN p_sort = 'last-order' THEN extract(epoch FROM last_order_at) END DESC NULLS LAST,
      CASE WHEN p_sort = 'name'       THEN name                              END ASC  NULLS LAST,
      id  -- deterministic tiebreaker for ties on the active sort column
    LIMIT  p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  SELECT jsonb_build_object(
    'totals',         to_jsonb((SELECT gt FROM global_totals gt)),
    'filtered_count', (SELECT n FROM filtered_count),
    'stores',         coalesce(
                        (SELECT jsonb_agg(to_jsonb(p)) FROM paginated p),
                        '[]'::jsonb
                      )
  );
$$;

-- Restrict execution to service_role only.
REVOKE EXECUTE ON FUNCTION get_admin_stores(text, text, text, text, text, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_admin_stores(text, text, text, text, text, int, int) FROM authenticated;
GRANT  EXECUTE ON FUNCTION get_admin_stores(text, text, text, text, text, int, int) TO service_role;
