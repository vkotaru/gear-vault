import {
  users,
  items,
  checkoutHistory,
  locations,
  spots,
  type User,
  type InsertUser,
  type Item,
  type InsertItem,
  type CheckoutHistory,
  type InsertCheckoutHistory,
  type UpdateCheckoutHistory,
  type Location,
  type InsertLocation,
  type Spot,
  type InsertSpot
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
      return user || undefined;
    } catch (error) {
      logger.error("Failed to get user by Google ID", { error });
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      logger.error("Failed to update user", { error, userId: id });
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
      // Cap the result set to avoid unbounded reads
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
      return await db.select().from(items).where(eq(items.status, "lent")).limit(50);
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
        .set({ status: "lent" })
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
        .set({ status: "stored" })
        .where(eq(items.id, itemId));
      
      return updatedCheckout;
    } catch (error) {
      logger.error("Failed to return item", { error, itemId });
      throw error;
    }
  }

  // Location methods
  async getAllLocations(owner?: string): Promise<Location[]> {
    try {
      const query = db.select().from(locations);
      const rows = owner
        ? await query.where(eq(locations.owner, owner)).limit(100)
        : await query.limit(100);
      return rows;
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

  async getAllLocationsWithItemCounts(owner?: string): Promise<(Location & { items: number })[]> {
    try {
      // Get all locations (optionally scoped to an owner)
      const allLocations = owner
        ? await db.select().from(locations).where(eq(locations.owner, owner))
        : await db.select().from(locations);

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

  async createLocation(location: InsertLocation & { owner?: string }): Promise<Location> {
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

      // Remove child spots first (they reference this location).
      await db.delete(spots).where(eq(spots.locationId, id));

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

  // Spot methods
  async getSpotsByLocation(locationId: number): Promise<Spot[]> {
    try {
      return await db.select().from(spots).where(eq(spots.locationId, locationId));
    } catch (error) {
      logger.error("Failed to get spots for location", { error, locationId });
      throw error;
    }
  }

  async createSpot(spot: InsertSpot): Promise<Spot> {
    try {
      const [newSpot] = await db.insert(spots).values(spot).returning();
      return newSpot;
    } catch (error) {
      logger.error("Failed to create spot", { error, spotName: spot.name });
      throw error;
    }
  }

  async deleteSpot(id: number): Promise<boolean> {
    try {
      // Detach any items pointing at this spot, then delete it.
      await db.update(items).set({ spotId: null }).where(eq(items.spotId, id));
      const result = await db.delete(spots).where(eq(spots.id, id)).returning({ id: spots.id });
      return result.length > 0;
    } catch (error) {
      logger.error("Failed to delete spot", { error, spotId: id });
      throw error;
    }
  }
}