CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE "public"."event_category" AS ENUM('Party', 'Concerti', 'Mostre', 'Aperitivi');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "venue" text NOT NULL,
  "category" "event_category" NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "image_url" text,
  "description" text NOT NULL,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_latitude_range" CHECK ("latitude" BETWEEN -90 AND 90),
  CONSTRAINT "events_longitude_range" CHECK ("longitude" BETWEEN -180 AND 180)
);

CREATE INDEX IF NOT EXISTS "events_starts_at_idx" ON "events" USING btree ("starts_at");
CREATE INDEX IF NOT EXISTS "events_category_starts_at_idx" ON "events" USING btree ("category", "starts_at");

ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "events" FROM anon, authenticated;
GRANT SELECT ON TABLE "events" TO anon, authenticated;

CREATE POLICY "Public events are readable"
  ON "events"
  FOR SELECT
  TO anon, authenticated
  USING (true);
