import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---
export const budgetLevelEnum = pgEnum("budget_level", ["LOW", "MEDIUM", "HIGH"]);
export const tripStatusEnum = pgEnum("trip_status", [
  "DRAFT",
  "GENERATING",
  "READY",
  "FAILED",
]);
export const activitySourceEnum = pgEnum("activity_source", [
  "AI",
  "PLACES",
  "MANUAL",
]);

// --- Users ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Trips ---
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    destinationName: varchar("destination_name", { length: 255 }).notNull(),
    destinationLat: doublePrecision("destination_lat"),
    destinationLng: doublePrecision("destination_lng"),

    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),

    budgetLevel: budgetLevelEnum("budget_level").notNull().default("MEDIUM"),
    interests: text("interests")
      .array()
      .notNull()
      .default([]),

    status: tripStatusEnum("status").notNull().default("DRAFT"),
    generationError: text("generation_error"),

    weatherSnapshot: jsonb("weather_snapshot"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("trips_user_id_idx").on(table.userId)]
);

// --- Trip Days ---
export const tripDays = pgTable(
  "trip_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),

    dayIndex: integer("day_index").notNull(),
    date: timestamp("date").notNull(),
    summary: text("summary"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("trip_days_trip_id_day_index_idx").on(
      table.tripId,
      table.dayIndex
    ),
  ]
);

// --- Activities ---
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripDayId: uuid("trip_day_id")
      .notNull()
      .references(() => tripDays.id, { onDelete: "cascade" }),

    orderIndex: integer("order_index").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    placeId: varchar("place_id", { length: 255 }),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    startTime: varchar("start_time", { length: 5 }), // "09:00"
    durationMinutes: integer("duration_minutes"),
    estimatedCostUsd: doublePrecision("estimated_cost_usd"),

    source: activitySourceEnum("source").notNull().default("AI"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("activities_trip_day_id_order_index_idx").on(
      table.tripDayId,
      table.orderIndex
    ),
  ]
);

// --- Relations (for query API convenience) ---
export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  days: many(tripDays),
}));

export const tripDaysRelations = relations(tripDays, ({ one, many }) => ({
  trip: one(trips, { fields: [tripDays.tripId], references: [trips.id] }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  tripDay: one(tripDays, {
    fields: [activities.tripDayId],
    references: [tripDays.id],
  }),
}));
