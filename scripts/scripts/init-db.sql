-- =========================================
-- Ultra Aircon Startup - PostgreSQL init
-- Safe, idempotent, production-friendly
-- =========================================

-- 1) Extensions commonly needed by modern apps
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS public;

-- 3) Keep public schema owned by postgres by default
ALTER SCHEMA public OWNER TO postgres;

-- 4) Reasonable default privileges on public schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 5) Optional: set default search path
ALTER DATABASE aircon_startup SET search_path TO public;

-- 6) No business tables here.
--    Tables, indexes, constraints should be created by:
--    - TypeORM migrations
--    - or the application bootstrap/migration flow
--
--    This avoids errors like:
--    ERROR: relation "users" does not exist
--
-- 7) Marker message
DO $$
BEGIN
  RAISE NOTICE 'init-db.sql completed successfully';
END
$$;