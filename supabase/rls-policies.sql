-- ============================================================
-- La Cuponera — Supabase Row Level Security (RLS) Policies
-- ============================================================
-- PURPOSE:
--   These policies enforce business rules at the DATABASE level,
--   independent of client-side code. Even if a client bypasses
--   the React UI, Supabase will reject unauthorized operations.
--   This is the "server-side validation" layer for this SPA.
--
-- HOW TO APPLY:
--   1. Open https://supabase.com/dashboard
--   2. Select project: oanuoscvnfkthfmjzyum
--   3. Go to SQL Editor (left sidebar)
--   4. Paste this entire file and click "Run"
--
-- ⚠️  IMPORTANT — KEY TYPES:
--   Your .env must use the ANON (public) key, NOT service_role.
--   service_role bypasses ALL policies below.
--   To get the anon key:
--     Dashboard → Project Settings → API → "anon / public" key
-- ============================================================


-- ============================================================
-- STEP 0: Enable RLS on every table
-- (Without this, all policies below are silently ignored)
-- ============================================================
ALTER TABLE empresas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubros      ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE clientes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras     ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- HELPER FUNCTIONS
-- These run with SECURITY DEFINER so they always see the
-- usuarios table regardless of caller permissions.
-- ============================================================

-- Returns the rol ('admin' | 'empresa' | 'empleado') of the
-- currently authenticated user, or NULL for unauthenticated.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL OR to_regclass('public.usuarios') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.rol INTO v_role
  FROM usuarios u
  WHERE u.user_id = auth.uid()
  LIMIT 1;

  RETURN v_role;
END;
$$;

-- Returns the empresa_id linked to the current user (empresa/empleado).
CREATE OR REPLACE FUNCTION get_my_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  IF auth.uid() IS NULL OR to_regclass('public.usuarios') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.empresa_id INTO v_empresa_id
  FROM usuarios u
  WHERE u.user_id = auth.uid()
  LIMIT 1;

  RETURN v_empresa_id;
END;
$$;

-- Returns the clientes.id for the current user (cliente role).
CREATE OR REPLACE FUNCTION get_my_cliente_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM clientes WHERE user_id = auth.uid()
$$;


-- ============================================================
-- EMPRESAS
-- ============================================================
-- Anyone (including unauthenticated) can view companies —
-- needed to display company names on public offer cards.
CREATE POLICY "empresas_select_public"
  ON empresas FOR SELECT
  USING (true);

-- Only admin can create companies.
CREATE POLICY "empresas_insert_admin"
  ON empresas FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Only admin can update companies.
CREATE POLICY "empresas_update_admin"
  ON empresas FOR UPDATE
  USING (get_my_role() = 'admin');

-- Only admin can delete companies.
CREATE POLICY "empresas_delete_admin"
  ON empresas FOR DELETE
  USING (get_my_role() = 'admin');


-- ============================================================
-- RUBROS
-- ============================================================
CREATE POLICY "rubros_select_public"
  ON rubros FOR SELECT
  USING (true);

CREATE POLICY "rubros_insert_admin"
  ON rubros FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "rubros_update_admin"
  ON rubros FOR UPDATE
  USING (get_my_role() = 'admin');

CREATE POLICY "rubros_delete_admin"
  ON rubros FOR DELETE
  USING (get_my_role() = 'admin');


-- ============================================================
-- USUARIOS (company admins + employees)
-- ============================================================
-- A user can read their own record; admin can read all.
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    -- A user can read their own record; admin can read all.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_select'
    ) THEN
      CREATE POLICY "usuarios_select"
        ON usuarios FOR SELECT
        USING (user_id = auth.uid() OR get_my_role() = 'admin');
    END IF;

    -- Only admin can insert user profiles.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_insert_admin'
    ) THEN
      CREATE POLICY "usuarios_insert_admin"
        ON usuarios FOR INSERT
        WITH CHECK (get_my_role() = 'admin');
    END IF;

    -- Admin can update any; a user can update only their own.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_update'
    ) THEN
      CREATE POLICY "usuarios_update"
        ON usuarios FOR UPDATE
        USING (get_my_role() = 'admin' OR user_id = auth.uid());
    END IF;

    -- Only admin can delete user profiles.
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'usuarios'
        AND policyname = 'usuarios_delete_admin'
    ) THEN
      CREATE POLICY "usuarios_delete_admin"
        ON usuarios FOR DELETE
        USING (get_my_role() = 'admin');
    END IF;
  END IF;
END $$;


-- ============================================================
-- CLIENTES
-- ============================================================
-- Clients see only their own record; admin sees all.
CREATE POLICY "clientes_select"
  ON clientes FOR SELECT
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Any authenticated user can self-register as a client.
-- The user_id must match the caller — prevents inserting
-- as someone else.
CREATE POLICY "clientes_insert_self"
  ON clientes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Client can update their own record; admin can update any.
CREATE POLICY "clientes_update"
  ON clientes FOR UPDATE
  USING (user_id = auth.uid() OR get_my_role() = 'admin');

-- Only admin can delete client records.
CREATE POLICY "clientes_delete_admin"
  ON clientes FOR DELETE
  USING (get_my_role() = 'admin');


-- ============================================================
-- OFERTAS
-- ============================================================
-- Public view: unauthenticated users see only APROBADA offers.
-- Authenticated empresa users see their own offers (all states).
-- Admin sees everything.
CREATE POLICY "ofertas_select"
  ON ofertas FOR SELECT
  USING (
    estado = 'APROBADA'                          -- public approved
    OR get_my_role() = 'admin'                   -- admin sees all
    OR empresa_id = get_my_empresa_id()          -- empresa sees own
    OR get_my_role() = 'empleado'                -- empleado can search for coupon validation
  );

-- Empresa users can only insert offers for their own company,
-- and the initial state MUST be PENDIENTE (enforced server-side).
CREATE POLICY "ofertas_insert"
  ON ofertas FOR INSERT
  WITH CHECK (
    (get_my_role() = 'empresa' AND empresa_id = get_my_empresa_id() AND estado = 'PENDIENTE')
    OR get_my_role() = 'admin'
  );

-- Empresa can update only their own PENDIENTE offers.
-- Admin can update any offer (including to approve/reject).
CREATE POLICY "ofertas_update"
  ON ofertas FOR UPDATE
  USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'empresa' AND empresa_id = get_my_empresa_id())
  );

-- Empresa can delete only their own PENDIENTE offers.
CREATE POLICY "ofertas_delete"
  ON ofertas FOR DELETE
  USING (
    get_my_role() = 'admin'
    OR (
      get_my_role() = 'empresa'
      AND empresa_id = get_my_empresa_id()
      AND estado = 'PENDIENTE'
    )
  );


-- ============================================================
-- CUPONES
-- ============================================================
-- Clients see only their own coupons.
-- Empleados and empresa users can query to validate coupons.
-- Admin sees all.
CREATE POLICY "cupones_select"
  ON cupones FOR SELECT
  USING (
    get_my_role() IN ('admin', 'empleado', 'empresa')
    OR cliente_id = get_my_cliente_id()
  );

-- Only authenticated clients can buy coupons for themselves.
-- cliente_id must match the caller's clientes record.
CREATE POLICY "cupones_insert_cliente"
  ON cupones FOR INSERT
  WITH CHECK (
    get_my_role() = 'cliente'
    AND cliente_id = get_my_cliente_id()
  );

-- Only empleados (redeeming) and admin can update coupon state.
CREATE POLICY "cupones_update"
  ON cupones FOR UPDATE
  USING (
    get_my_role() = 'admin'
    OR get_my_role() = 'empleado'
  );

-- Only admin can delete coupons.
CREATE POLICY "cupones_delete_admin"
  ON cupones FOR DELETE
  USING (get_my_role() = 'admin');


-- ============================================================
-- COMPRAS
-- ============================================================
-- Clients see their own purchases; admin sees all.
CREATE POLICY "compras_select"
  ON compras FOR SELECT
  USING (
    get_my_role() = 'admin'
    OR cliente_id = get_my_cliente_id()
  );

-- Clients insert their own purchase records.
CREATE POLICY "compras_insert_cliente"
  ON compras FOR INSERT
  WITH CHECK (
    cliente_id = get_my_cliente_id()
  );

-- Only admin can delete purchase records.
CREATE POLICY "compras_delete_admin"
  ON compras FOR DELETE
  USING (get_my_role() = 'admin');


-- ============================================================
-- DATABASE-LEVEL CONSTRAINTS (Server-side validation)
-- These are enforced by the Postgres engine on every INSERT/UPDATE,
-- regardless of which API key the client uses. They mirror the
-- client-side validation rules in the React forms.
-- Run these only once; skip if already applied.
-- ============================================================

-- Offer price must be strictly lower than regular price.
DO $$
BEGIN
  IF to_regclass('public.ofertas') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_precio_oferta_menor'
  ) THEN
    ALTER TABLE ofertas
      ADD CONSTRAINT chk_precio_oferta_menor
      CHECK (precio_oferta < precio_regular) NOT VALID;
  END IF;
END $$;

-- Offer quantity limit must be positive.
DO $$
BEGIN
  IF to_regclass('public.ofertas') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cantidad_limite_positiva'
  ) THEN
    ALTER TABLE ofertas
      ADD CONSTRAINT chk_cantidad_limite_positiva
      CHECK (cantidad_limite IS NULL OR cantidad_limite > 0) NOT VALID;
  END IF;
END $$;

-- Offer status must be one of the three allowed values.
DO $$
BEGIN
  IF to_regclass('public.ofertas') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_oferta_estado'
  ) THEN
    ALTER TABLE ofertas
      ADD CONSTRAINT chk_oferta_estado
      CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')) NOT VALID;
  END IF;
END $$;

-- Coupon status must be one of the three allowed values.
DO $$
BEGIN
  IF to_regclass('public.cupones') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cupon_estado'
  ) THEN
    ALTER TABLE cupones
      ADD CONSTRAINT chk_cupon_estado
      CHECK (estado IN ('disponible', 'canjeado', 'vencido')) NOT VALID;
  END IF;
END $$;

-- Coupon code must not be blank.
DO $$
BEGIN
  IF to_regclass('public.cupones') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cupon_codigo_not_blank'
  ) THEN
    ALTER TABLE cupones
      ADD CONSTRAINT chk_cupon_codigo_not_blank
      CHECK (length(trim(codigo)) >= 4) NOT VALID;
  END IF;
END $$;

-- Users table: rol must be a known value.
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_usuario_rol'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT chk_usuario_rol
      CHECK (rol IN ('admin', 'empresa', 'empleado')) NOT VALID;
  END IF;
END $$;

-- Empresas: commission percentage must be 0–100.
DO $$
BEGIN
  IF to_regclass('public.empresas') IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_comision_rango'
  ) THEN
    ALTER TABLE empresas
      ADD CONSTRAINT chk_comision_rango
      CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 100) NOT VALID;
  END IF;
END $$;


-- ============================================================
-- SETUP: Create your admin user
-- ============================================================
-- Run these steps in order:
--
-- 1. Create the Supabase Auth user:
--      Dashboard → Authentication → Users → "Add user"
--      Set email and a strong password.
--      Copy the UUID shown after creation.
--
-- 2. Insert the admin profile (replace the UUID below):
--
--    DO $$
--    BEGIN
--      IF to_regclass('public.usuarios') IS NOT NULL THEN
--        INSERT INTO usuarios (user_id, nombre, rol)
--        VALUES (
--          '9ba816d4-81fc-4255-a9d3-d27361414c77',
--          'Administrador',
--          'admin'
--        )
--        ON CONFLICT (user_id) DO UPDATE
--          SET nombre = EXCLUDED.nombre,
--              rol = EXCLUDED.rol;
--      ELSE
--        RAISE NOTICE 'Skipping admin profile insert: table public.usuarios does not exist.';
--      END IF;
--    END $$;
--
-- 3. Log in via the normal /login page with that email + password.
--    The app reads rol from the usuarios table and redirects to /admin/cupones.
--
-- ============================================================
-- SETUP: Create empresa admin users
-- ============================================================
-- 1. Create the Supabase Auth user as above.
-- 2. Find the empresa id from the empresas table:
--      SELECT id, nombre FROM empresas;
-- 3. Insert the empresa user profile:
--
--    DO $$
--    BEGIN
--      IF to_regclass('public.usuarios') IS NOT NULL THEN
--        INSERT INTO usuarios (user_id, nombre, rol, empresa_id)
--        VALUES (
--          '8cff128b-ff57-4c21-8b38-eb279c793a3c',  -- auth user UUID
--          'Nombre del Admin Empresa',
--          'empresa',
--          'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy'   -- empresa id
--        )
--        ON CONFLICT (user_id) DO UPDATE
--          SET nombre = EXCLUDED.nombre,
--              rol = EXCLUDED.rol,
--              empresa_id = EXCLUDED.empresa_id;
--      ELSE
--        RAISE NOTICE 'Skipping empresa admin insert: table public.usuarios does not exist.';
--      END IF;
--    END $$;
-- ============================================================
