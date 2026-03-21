CREATE TYPE "public"."event_status" AS ENUM('pending', 'leased', 'delivered', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."node_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"node_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"status" "event_status" DEFAULT 'pending' NOT NULL,
	"headers_json" jsonb NOT NULL,
	"body_text" text NOT NULL,
	"content_type" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"acked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" "node_status" DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"node_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_node_status_idx" ON "events" USING btree ("node_id","status");--> statement-breakpoint
CREATE INDEX "events_node_status_received_idx" ON "events" USING btree ("node_id","status","received_at");--> statement-breakpoint
CREATE INDEX "events_route_received_idx" ON "events" USING btree ("route_id","received_at");--> statement-breakpoint
CREATE INDEX "events_expires_at_idx" ON "events" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "nodes_user_id_idx" ON "nodes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nodes_slug_key" ON "nodes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "routes_node_id_idx" ON "routes" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "routes_user_id_idx" ON "routes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_slug_key" ON "routes" USING btree ("slug");