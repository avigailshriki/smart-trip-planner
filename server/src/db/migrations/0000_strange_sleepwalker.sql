CREATE TYPE "public"."activity_source" AS ENUM('AI', 'PLACES', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."budget_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('DRAFT', 'GENERATING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_day_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"place_id" varchar(255),
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"start_time" varchar(5),
	"duration_minutes" integer,
	"estimated_cost_usd" double precision,
	"source" "activity_source" DEFAULT 'AI' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"day_index" integer NOT NULL,
	"date" timestamp NOT NULL,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"destination_name" varchar(255) NOT NULL,
	"destination_lat" double precision,
	"destination_lng" double precision,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"budget_level" "budget_level" DEFAULT 'MEDIUM' NOT NULL,
	"interests" text[] DEFAULT '{}' NOT NULL,
	"status" "trip_status" DEFAULT 'DRAFT' NOT NULL,
	"generation_error" text,
	"weather_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_trip_day_id_trip_days_id_fk" FOREIGN KEY ("trip_day_id") REFERENCES "public"."trip_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_trip_day_id_order_index_idx" ON "activities" USING btree ("trip_day_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_days_trip_id_day_index_idx" ON "trip_days" USING btree ("trip_id","day_index");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");