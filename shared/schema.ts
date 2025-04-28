import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for item categories
export const categoryEnum = pgEnum("category", [
  "camping",
  "hiking",
  "biking",
  "water",
  "winter",
  "other"
]);

// Enum for item status
export const statusEnum = pgEnum("status", [
  "available",
  "checked_out"
]);

// Base User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Location schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Item schema
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  brand: text("brand"),
  category: categoryEnum("category").notNull(),
  owner: text("owner").notNull(),
  isShared: boolean("is_shared").notNull().default(true),
  locationId: integer("location_id").references(() => locations.id),
  storageLocation: text("storage_location").notNull(),
  storageAddress: text("storage_address"),
  condition: text("condition").default("Good"),
  imageUrls: text("image_urls").array(),
  status: statusEnum("status").notNull().default("available"),
  addedOn: timestamp("added_on").notNull().defaultNow(),
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

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  addedOn: true,
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
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type InsertCheckoutHistory = z.infer<typeof insertCheckoutHistorySchema>;
export type CheckoutHistory = typeof checkoutHistory.$inferSelect;
export type UpdateCheckoutHistory = z.infer<typeof updateCheckoutHistorySchema>;
