-- Route slugs are now unique per user instead of globally unique.
-- Drop the global unique index and replace it with a composite (user_id, slug) index.
DROP INDEX "routes_slug_key";--> statement-breakpoint
CREATE UNIQUE INDEX "routes_user_id_slug_key" ON "routes" USING btree ("user_id","slug");
