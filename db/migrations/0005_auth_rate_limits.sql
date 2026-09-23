CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
  "key" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_rate_limits_kind_idx" ON "auth_rate_limits" USING btree ("kind");
