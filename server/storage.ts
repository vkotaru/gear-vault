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
import session from "express-session";
import createMemoryStore from "memorystore";
import { DatabaseStorage } from "./database-storage";
import logger from "./logger";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Item methods
  getAllItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  getItemsByOwner(owner: string): Promise<Item[]>;
  getSharedItems(): Promise<Item[]>;
  getCheckedOutItems(): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;

  // Checkout methods
  getCheckoutHistory(itemId: number): Promise<CheckoutHistory[]>;
  checkoutItem(checkout: InsertCheckoutHistory): Promise<CheckoutHistory>;
  returnItem(itemId: number, returnData: UpdateCheckoutHistory): Promise<CheckoutHistory | undefined>;

  // Location methods
  getAllLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationWithItemCount(id: number): Promise<(Location & { items: number }) | undefined>;
  getAllLocationsWithItemCounts(): Promise<(Location & { items: number })[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private checkoutHistory: Map<number, CheckoutHistory>;
  private locations: Map<number, Location>;
  sessionStore: session.Store;
  currentUserId: number;
  currentItemId: number;
  currentCheckoutId: number;
  currentLocationId: number;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.checkoutHistory = new Map();
    this.locations = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    this.currentUserId = 1;
    this.currentItemId = 1;
    this.currentCheckoutId = 1;
    this.currentLocationId = 1;
    
    // Add default admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "password",
      googleId: null,
      email: null,
      displayName: null,
      avatarUrl: null,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, googleId: null, email: null, displayName: null, avatarUrl: null };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  // Item methods
  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemsByOwner(owner: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.owner === owner
    );
  }

  async getSharedItems(): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.isShared
    );
  }

  async getCheckedOutItems(): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.status === "checked_out"
    );
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    const addedOn = new Date();
    
    // Create a complete item object with all required fields and proper defaults
    const item: Item = {
      id, 
      addedOn,
      name: insertItem.name,
      category: insertItem.category,
      owner: insertItem.owner,
      isShared: insertItem.isShared ?? false,
      locationId: insertItem.locationId ?? null,
      storageLocation: insertItem.storageLocation,
      storageAddress: insertItem.storageAddress ?? null,
      condition: insertItem.condition ?? "Good",
      brand: insertItem.brand ?? null,
      description: insertItem.description ?? null,
      status: insertItem.status ?? "available",
      imageUrls: insertItem.imageUrls ?? []
    };
    
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: number, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const existingItem = this.items.get(id);
    if (!existingItem) {
      return undefined;
    }

    const updatedItem: Item = { ...existingItem, ...updateData };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  // Checkout methods
  async getCheckoutHistory(itemId: number): Promise<CheckoutHistory[]> {
    return Array.from(this.checkoutHistory.values()).filter(
      (history) => history.itemId === itemId
    ).sort((a, b) => 
      new Date(b.checkedOutOn).getTime() - new Date(a.checkedOutOn).getTime()
    );
  }

  async checkoutItem(checkout: InsertCheckoutHistory): Promise<CheckoutHistory> {
    const id = this.currentCheckoutId++;
    
    // Create a valid CheckoutHistory record with all required fields
    const checkoutRecord: CheckoutHistory = { 
      ...checkout, 
      id,
      checkedOutOn: checkout.checkedOutOn || new Date(),
      dueBack: checkout.dueBack || null,
      returnedOn: null // Not returned yet
    };
    
    // Update item status
    const item = this.items.get(checkout.itemId);
    if (item) {
      this.items.set(checkout.itemId, { ...item, status: "checked_out" });
    }

    this.checkoutHistory.set(id, checkoutRecord);
    return checkoutRecord;
  }

  async returnItem(itemId: number, returnData: UpdateCheckoutHistory): Promise<CheckoutHistory | undefined> {
    // Find the most recent checkout for this item that hasn't been returned
    const checkouts = Array.from(this.checkoutHistory.values()).filter(
      (history) => history.itemId === itemId && !history.returnedOn
    ).sort((a, b) => 
      new Date(b.checkedOutOn).getTime() - new Date(a.checkedOutOn).getTime()
    );

    if (checkouts.length === 0) {
      return undefined;
    }

    const latestCheckout = checkouts[0];
    const updatedCheckout: CheckoutHistory = { ...latestCheckout, ...returnData };
    
    // Update item status
    const item = this.items.get(itemId);
    if (item) {
      this.items.set(itemId, { ...item, status: "available" });
    }

    this.checkoutHistory.set(latestCheckout.id, updatedCheckout);
    return updatedCheckout;
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationWithItemCount(id: number): Promise<(Location & { items: number }) | undefined> {
    const location = this.locations.get(id);
    if (!location) {
      return undefined;
    }

    const itemCount = Array.from(this.items.values()).filter(
      (item) => item.locationId === id
    ).length;

    return {
      ...location,
      items: itemCount
    };
  }

  async getAllLocationsWithItemCounts(): Promise<(Location & { items: number })[]> {
    return Array.from(this.locations.values()).map(location => {
      const itemCount = Array.from(this.items.values()).filter(
        (item) => item.locationId === location.id
      ).length;

      return {
        ...location,
        items: itemCount
      };
    });
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = this.currentLocationId++;
    const createdAt = new Date();
    
    const newLocation: Location = {
      id,
      name: location.name,
      address: location.address,
      description: location.description || null,
      createdAt
    };
    
    this.locations.set(id, newLocation);
    return newLocation;
  }

  async updateLocation(id: number, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const existingLocation = this.locations.get(id);
    if (!existingLocation) {
      return undefined;
    }

    const updatedLocation: Location = { ...existingLocation, ...updateData };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
