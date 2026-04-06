-- ================================================================
-- Migration 015: Admin overview RPC
-- ================================================================
-- Purpose:
--   Replace the two full-table fetches (all stores + all orders) in
--   admin/page.tsx with a single SQL function that returns all the
--   data needed for the overview dashboard in one round-trip.
--
-- Performance:
--   Before: O(stores) + O(orders) rows sent over the network, then
--           aggregated in JavaScript via a Map.
--   After:  One RPC call returning a small jsonb blob (~1-2 KB).
--
-- Design decisions:
--   · SECURITY INVOKER (default): service_role already bypasses RLS;
--     elevating to DEFINER would grant more privilege than needed.
--   · SET search_path = public: prevents search-path injection attacks
--     regardless of invoker mode.
--   · RETURNS jsonb: binary storage, consistent with PostgREST internals.
--   · status != 'cancelled': safe because orders.status is NOT NULL
--     (NOT NULL + CHECK constraint) — identical to IS DISTINCT FROM here.
--   · "new_stores_this_month" uses date_trunc('month', now()) = calendar
--     month, matching the UI label "Nuevas este mes".
--
-- Caller:  Server-only via createAdminClient() (service_role key).
--          Never call this from the browser client.
-- ================================================================

CREATE OR REPLACE FUNCTION get_admin_overview()
RETURNS jsonb
LANGUAGE sql
SET search_path = public
AS $$
  WITH store_order_stats AS (
    -- Aggregate order data per store in a single pass.
    -- Excludes cancelled orders (orders.status is NOT NULL + CHECK,
    -- so != 'cancelled' is safe without IS DISTINCT FROM).
    SELECT
      store_id,
      count(*)::int                                                         AS total_orders,
      coalesce(sum(total), 0)                                               AS total_revenue,
      count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS orders_last_30d,
      max(created_at)                                                       AS last_order_at
    FROM orders
    WHERE status != 'cancelled'
    GROUP BY store_id
  ),
  enriched AS (
    -- Join stores with their aggregated order stats once.
    SELECT
      s.id,
      s.name,
      s.slug,
      s.is_active,
      s.created_at,
      coalesce(sos.total_orders,    0) AS total_orders,
      coalesce(sos.total_revenue,   0) AS total_revenue,
      coalesce(sos.orders_last_30d, 0) AS orders_last_30d,
      sos.last_order_at
    FROM stores s
    LEFT JOIN store_order_stats sos ON sos.store_id = s.id
  )
  SELECT jsonb_build_object(
    -- ── Aggregate stats for summary cards and alerts ─────────────
    'stats', (
      SELECT jsonb_build_object(
        'total_stores',                    count(*),
        'active_stores',                   count(*) FILTER (WHERE is_active = true),
        'inactive_stores',                 count(*) FILTER (WHERE is_active = false),
        'new_stores_this_month',           count(*) FILTER (WHERE created_at >= date_trunc('month', now())),
        'stores_without_orders',           count(*) FILTER (WHERE total_orders = 0),
        'stores_without_recent_activity',  count(*) FILTER (WHERE orders_last_30d = 0),
        'platform_total_orders',           coalesce(sum(total_orders),  0),
        'platform_total_revenue',          coalesce(sum(total_revenue), 0)
      )
      FROM enriched
    ),

    -- ── Top 5 new stores this month (for "Tiendas nuevas" card) ──
    'recent_new_stores', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT id, name, slug, created_at, total_orders
        FROM enriched
        WHERE created_at >= date_trunc('month', now())
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    ),

    -- ── Top 5 stores with no activity in 30 days (to review) ─────
    -- Sort: zero-order stores first, then by oldest last_order_at,
    -- then by created_at ASC as a stable tiebreaker.
    'stores_to_review', (
      SELECT coalesce(jsonb_agg(t), '[]'::jsonb)
      FROM (
        SELECT
          id,
          name,
          slug,
          created_at,
          last_order_at,
          (total_orders > 0) AS has_orders
        FROM enriched
        WHERE orders_last_30d = 0
        ORDER BY
          CASE WHEN total_orders = 0 THEN 0 ELSE 1 END ASC,
          last_order_at ASC NULLS FIRST,
          created_at ASC
        LIMIT 5
      ) t
    )
  );
$$;

-- Restrict execution to service_role only.
-- anon and authenticated must never be able to call this directly.
REVOKE EXECUTE ON FUNCTION get_admin_overview() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_admin_overview() FROM authenticated;
GRANT  EXECUTE ON FUNCTION get_admin_overview() TO service_role;
