import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Item categories are stored as free text (see items.category). A built-in set
// lives in client/src/lib/categories.ts; users can add their own via the
// categories table below.

// Enum for item status
export const statusEnum = pgEnum("status", [
  "stored",
  "in_use",
  "unknown",
  "lent"
]);

// Base User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleId: text("google_id").unique(),
  email: text("email"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
});

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  owner: text("owner"),  // username of the creator; locations are private per user
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User-defined item categories (in addition to the built-in set).
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner"),  // username of the creator; private per user
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Spot schema — a named sub-location within a place (e.g. "Box 1", "Living Room")
export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locations.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Item schema
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  brand: text("brand"),
  category: text("category").notNull(),
  owner: text("owner").notNull(),
  isShared: boolean("is_shared").notNull().default(true),
  locationId: integer("location_id").references(() => locations.id),  // Optional field
  spotId: integer("spot_id").references(() => spots.id),  // Optional sub-location
  storageLocation: text("storage_location").notNull(),
  storageAddress: text("storage_address"),
  condition: text("condition").default("Good"),
  imageUrls: text("image_urls").array(),
  status: statusEnum("status").notNull().default("stored"),
  lentTo: text("lent_to"),
  addedOn: timestamp("added_on").notNull().defaultNow(),
  lastSeen: timestamp("last_seen"),  // when its whereabouts were last confirmed
});

// Trip schema — an outing you take gear on (private per user)
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner"),  // username of the creator; trips are private per user
  destination: text("destination"),
  notes: text("notes"),
  url: text("url"),  // optional link (trip report, photos, AllTrails, etc.)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Join table: which items were taken on which trip (many-to-many)
export const tripItems = pgTable("trip_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  itemId: integer("item_id").notNull().references(() => items.id),
});

// CheckoutHistory schema
export const checkoutHistory = pgTable("checkout_history", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  checkedOutBy: text("checked_out_by").notNull(),
  checkedOutOn: timestamp("checked_out_on").notNull().defaultNow(),
  dueBack: timestamp("due_back"),
  returnedOn: timestamp("returned_on"),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertItemSchema = createInsertSchema(items)
  .omit({
    id: true,
    addedOn: true,
  })
  .extend({
    // Optional purchase/added date. Accepts an ISO date string (from JSON) and
    // coerces it to a Date; when omitted, the DB defaults to now().
    addedOn: z.coerce.date().optional(),
    lastSeen: z.coerce.date().nullish(),
  });

export const insertCheckoutHistorySchema = createInsertSchema(checkoutHistory).omit({
  id: true,
  returnedOn: true,
});

export const updateCheckoutHistorySchema = createInsertSchema(checkoutHistory).pick({
  returnedOn: true,
});

// Location schemas
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  owner: true, // set server-side from the session
});

export const insertSpotSchema = createInsertSchema(spots).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true, createdAt: true, owner: true })
  .extend({ name: z.string().min(1).max(40) });

// A trip's `url` field holds one or more links as a comma-separated string.
// parseTripLinks splits and trims it into individual URLs.
export function parseTripLinks(url: string | null | undefined): string[] {
  if (!url) return [];
  return url.split(",").map((u) => u.trim()).filter(Boolean);
}

function isValidUrl(u: string): boolean {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

// Trip schemas
export const insertTripSchema = createInsertSchema(trips)
  .omit({
    id: true,
    createdAt: true,
    owner: true, // set server-side from the session
  })
  .extend({
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
    destination: z.string().nullish(),
    notes: z.string().nullish(),
    // One or more links, comma-separated; each must be a valid URL (or empty).
    url: z
      .string()
      .nullish()
      .refine(
        (v) => parseTripLinks(v).every(isValidUrl),
        { message: "Each link must be a valid URL (separate multiple with commas)" }
      ),
  });

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertSpot = z.infer<typeof insertSpotSchema>;
export type Spot = typeof spots.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type TripItem = typeof tripItems.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertCheckoutHistory = z.infer<typeof insertCheckoutHistorySchema>;
export type CheckoutHistory = typeof checkoutHistory.$inferSelect;
export type UpdateCheckoutHistory = z.infer<typeof updateCheckoutHistorySchema>;
