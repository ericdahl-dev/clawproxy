-- Node slugs become unique per user instead of globally unique (same as routes in 0002).
-- Also re-asserts the routes change from 0002: its snapshot never recorded it, and production
-- had drifted back to the global index until 2026-09-22.
-- Create each per-user index before dropping the global one so uniqueness is never unenforced,
-- and use IF [NOT] EXISTS so the migration is safe on databases where part of it already applied.
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_user_id_slug_key" ON "nodes" USING btree ("user_id","slug");--> statement-breakpoint
DROP INDEX IF EXISTS "nodes_slug_key";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "routes_user_id_slug_key" ON "routes" USING btree ("user_id","slug");--> statement-breakpoint
DROP INDEX IF EXISTS "routes_slug_key";
