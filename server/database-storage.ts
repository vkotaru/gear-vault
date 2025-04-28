import { 
  users, 
  items, 
  checkoutHistory,
  locations,
  type User, 
  type InsertUser, 
  type Item, 
  type InsertItem, 
  type CheckoutHistory, 
  type InsertCheckoutHistory,
  type UpdateCheckoutHistory,
  type Location,
  type InsertLocation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import logger from "./logger";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create PG session store
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
    logger.info("PostgreSQL session store initialized");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      logger.error("Failed to get user by ID", { error, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      logger.error("Failed to get user by username", { error, username });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      logger.error("Failed to create user", { error, username: insertUser.username });
      throw error;
    }
  }

  // Item methods
  async getAllItems(): Promise<Item[]> {
    try {
      // Add a limit to fetch only the first 100 items and apply caching for better performance
      return await db.select().from(items).limit(100);
    } catch (error) {
      logger.error("Failed to get all items", { error });
      throw error;
    }
  }

  async getItem(id: number): Promise<Item | undefined> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, id));
      return item || undefined;
    } catch (error) {
      logger.error("Failed to get item by ID", { error, itemId: id });
      throw error;
    }
  }

  async getItemsByOwner(owner: string): Promise<Item[]> {
    try {
      return await db.select().from(items).where(eq(items.owner, owner)).limit(50);
    } catch (error) {
      logger.error("Failed to get items by owner", { error, owner });
      throw error;
    }
  }

  async getSharedItems(): Promise<Item[]> {
    try {
      return await db.select().from(items).where(eq(items.isShared, true)).limit(50);
    } catch (error) {
      logger.error("Failed to get shared items", { error });
      throw error;
    }
  }

  async getCheckedOutItems(): Promise<Item[]> {
    try {
      return await db.select().from(items).where(eq(items.status, "checked_out")).limit(50);
    } catch (error) {
      logger.error("Failed to get checked out items", { error });
      throw error;
    }
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    try {
      const [item] = await db
        .insert(items)
        .values(insertItem)
        .returning();
      return item;
    } catch (error) {
      logger.error("Failed to create item", { error, itemName: insertItem.name });
      throw error;
    }
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    try {
      const [updatedItem] = await db
        .update(items)
        .set(updateData)
        .where(eq(items.id, id))
        .returning();
      return updatedItem || undefined;
    } catch (error) {
      logger.error("Failed to update item", { error, itemId: id });
      throw error;
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(items)
        .where(eq(items.id, id))
        .returning({ id: items.id });
      return result.length > 0;
    } catch (error) {
      logger.error("Failed to delete item", { error, itemId: id });
      throw error;
    }
  }

  // Checkout methods
  async getCheckoutHistory(itemId: number): Promise<CheckoutHistory[]> {
    try {
      return await db
        .select()
        .from(checkoutHistory)
        .where(eq(checkoutHistory.itemId, itemId))
        .orderBy(desc(checkoutHistory.checkedOutOn));
    } catch (error) {
      logger.error("Failed to get checkout history", { error, itemId });
      throw error;
    }
  }

  async checkoutItem(checkout: InsertCheckoutHistory): Promise<CheckoutHistory> {
    try {
      // Create checkout record
      const [checkoutRecord] = await db
        .insert(checkoutHistory)
        .values(checkout)
        .returning();
      
      // Update item status
      await db
        .update(items)
        .set({ status: "checked_out" })
        .where(eq(items.id, checkout.itemId));
      
      return checkoutRecord;
    } catch (error) {
      logger.error("Failed to checkout item", { error, itemId: checkout.itemId });
      throw error;
    }
  }

  async returnItem(itemId: number, returnData: UpdateCheckoutHistory): Promise<CheckoutHistory | undefined> {
    try {
      // Find the most recent checkout for this item that hasn't been returned
      const [latestCheckout] = await db
        .select()
        .from(checkoutHistory)
        .where(
          and(
            eq(checkoutHistory.itemId, itemId),
            isNull(checkoutHistory.returnedOn)
          )
        )
        .orderBy(desc(checkoutHistory.checkedOutOn))
        .limit(1);
      
      if (!latestCheckout) {
        return undefined;
      }
      
      // Update the checkout record
      const [updatedCheckout] = await db
        .update(checkoutHistory)
        .set(returnData)
        .where(eq(checkoutHistory.id, latestCheckout.id))
        .returning();
      
      // Update the item status
      await db
        .update(items)
        .set({ status: "available" })
        .where(eq(items.id, itemId));
      
      return updatedCheckout;
    } catch (error) {
      logger.error("Failed to return item", { error, itemId });
      throw error;
    }
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    try {
      return await db.select().from(locations).limit(100);
    } catch (error) {
      logger.error("Failed to get all locations", { error });
      throw error;
    }
  }

  async getLocation(id: number): Promise<Location | undefined> {
    try {
      const [location] = await db.select().from(locations).where(eq(locations.id, id));
      return location || undefined;
    } catch (error) {
      logger.error("Failed to get location by ID", { error, locationId: id });
      throw error;
    }
  }

  async getLocationWithItemCount(id: number): Promise<(Location & { items: number }) | undefined> {
    try {
      // First get the location
      const [location] = await db.select().from(locations).where(eq(locations.id, id));
      
      if (!location) {
        return undefined;
      }
      
      // Count items at this location
      const itemsAtLocation = await db.select().from(items).where(eq(items.locationId, id));
      
      return {
        ...location,
        items: itemsAtLocation.length
      };
    } catch (error) {
      logger.error("Failed to get location with item count", { error, locationId: id });
      throw error;
    }
  }

  async getAllLocationsWithItemCounts(): Promise<(Location & { items: number })[]> {
    try {
      // Get all locations
      const allLocations = await db.select().from(locations);
      
      // For each location, get the item count
      const locationsWithCounts = await Promise.all(
        allLocations.map(async (location) => {
          const itemsAtLocation = await db.select().from(items).where(eq(items.locationId, location.id));
          return {
            ...location,
            items: itemsAtLocation.length
          };
        })
      );
      
      return locationsWithCounts;
    } catch (error) {
      logger.error("Failed to get all locations with item counts", { error });
      throw error;
    }
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    try {
      const [newLocation] = await db
        .insert(locations)
        .values(location)
        .returning();
      return newLocation;
    } catch (error) {
      logger.error("Failed to create location", { error, locationName: location.name });
      throw error;
    }
  }

  async updateLocation(id: number, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    try {
      const [updatedLocation] = await db
        .update(locations)
        .set(updateData)
        .where(eq(locations.id, id))
        .returning();
      return updatedLocation || undefined;
    } catch (error) {
      logger.error("Failed to update location", { error, locationId: id });
      throw error;
    }
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      // First check if there are any items at this location
      const itemsAtLocation = await db.select().from(items).where(eq(items.locationId, id));
      
      if (itemsAtLocation.length > 0) {
        // Can't delete a location that has items
        logger.warn("Cannot delete location with items", { locationId: id, itemCount: itemsAtLocation.length });
        return false;
      }
      
      const result = await db
        .delete(locations)
        .where(eq(locations.id, id))
        .returning({ id: locations.id });
      return result.length > 0;
    } catch (error) {
      logger.error("Failed to delete location", { error, locationId: id });
      throw error;
    }
  }
}