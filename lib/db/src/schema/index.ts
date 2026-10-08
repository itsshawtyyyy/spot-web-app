import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const eventCategory = pgEnum("event_category", [
  "Party",
  "Concerti",
  "Mostre",
  "Aperitivi",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    venue: text("venue").notNull(),
    category: eventCategory("category").notNull(),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    imageUrl: text("image_url"),
    description: text("description").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("events_latitude_range", sql`${table.latitude} between -90 and 90`),
    check(
      "events_longitude_range",
      sql`${table.longitude} between -180 and 180`,
    ),
    index("events_starts_at_idx").on(table.startsAt),
    index("events_category_starts_at_idx").on(table.category, table.startsAt),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
