-- ================================================================
-- MIGRATION 017: Correcciones de la auditoría de RLS
-- ================================================================
-- Hallazgos corregidos acá:
--
--   1. get_admin_overview() y get_admin_stores(...) son ejecutables por
--      el rol `anon`, es decir por cualquiera que tenga la clave pública
--      (que viaja en el bundle del navegador).
--
--      Causa: las migraciones 015 y 016 hacen
--          REVOKE ... FROM PUBLIC;
--          REVOKE ... FROM authenticated;
--      pero NO revocan de `anon`. Supabase concede EXECUTE sobre las
--      funciones del esquema public a anon/authenticated/service_role por
--      privilegios por defecto, y esa concesión directa NO se elimina al
--      revocar de PUBLIC. El rol `anon` quedó con el permiso.
--
--      Las dos funciones son SECURITY INVOKER, así que RLS igual limita
--      lo que devuelven: no filtran pedidos ni clientes. Lo que sí
--      exponen es el panorama de la plataforma (cantidad de tiendas,
--      listado con fechas de alta y actividad). Es defensa en profundidad
--      que falló, no una fuga de datos privados.
--
--   2. admin_actions_log es legible y escribible por CUALQUIER usuario
--      autenticado: la política usa `auth.uid() IS NOT NULL`. Cualquier
--      dueño de tienda podía leer el historial de acciones del admin de
--      la plataforma e insertar entradas falsas.
--
--      La app solo escribe esa tabla con el cliente de service_role
--      (src/app/admin/stores/actions.ts), que saltea RLS. Así que sacar
--      las políticas no rompe nada.
--
-- Idempotente: se puede correr más de una vez sin efecto adicional.
-- ================================================================


-- ── 1. REVOCAR LOS RPC DE ADMIN DEL ROL anon ────────────────────
-- Se recorre pg_proc para cubrir todas las sobrecargas, porque la firma
-- desplegada de get_admin_stores no coincide con la de la migración 016.

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      p.oid::regprocedure AS firma
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_admin_overview', 'get_admin_stores')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.firma);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.firma);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.firma);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.firma);
    RAISE NOTICE 'Permisos corregidos en %', f.firma;
  END LOOP;
END $$;


-- ── 2. admin_actions_log: SOLO service_role ─────────────────────
-- Sin políticas, RLS niega todo a anon y authenticated. service_role
-- saltea RLS, así que el panel de admin sigue funcionando igual.

DROP POLICY IF EXISTS "Authenticated users can view admin action logs" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.admin_actions_log;

ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_actions_log IS
  'Historial de acciones del super admin. Sin políticas RLS a propósito: '
  'solo se accede con el cliente de service_role desde el servidor. '
  'No agregar políticas para `authenticated` sin restringir a super admin.';
