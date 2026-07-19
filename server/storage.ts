import type {
  User,
  InsertUser,
  Item,
  InsertItem,
  CheckoutHistory,
  InsertCheckoutHistory,
  UpdateCheckoutHistory,
  Location,
  InsertLocation,
  Spot,
  InsertSpot,
  Trip,
  InsertTrip,
  Category,
  InsertCategory
} from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from "./database-storage";

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

  // Location methods (scoped to an owner when provided)
  getAllLocations(owner?: string): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocationWithItemCount(id: number): Promise<(Location & { items: number }) | undefined>;
  getAllLocationsWithItemCounts(owner?: string): Promise<(Location & { items: number })[]>;
  createLocation(location: InsertLocation & { owner?: string }): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Spot methods (sub-locations within a place)
  getSpotsByLocation(locationId: number): Promise<Spot[]>;
  createSpot(spot: InsertSpot): Promise<Spot>;
  deleteSpot(id: number): Promise<boolean>;

  // Category methods (scoped to an owner; built-ins are seeded per user)
  getCategories(owner: string): Promise<Category[]>;
  seedBuiltinCategories(owner: string): Promise<void>;
  createCategory(category: { name: string; value: string; icon: string; builtin: boolean; owner: string }): Promise<Category>;
  updateCategory(id: number, owner: string, name: string): Promise<Category | undefined>;
  deleteCategory(id: number, owner: string): Promise<boolean>;

  // Trip methods (scoped to an owner)
  getAllTrips(owner: string): Promise<(Trip & { itemCount: number })[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip & { owner?: string }): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<boolean>;
  getTripItems(tripId: number): Promise<Item[]>;
  addItemToTrip(tripId: number, itemId: number): Promise<void>;
  removeItemFromTrip(tripId: number, itemId: number): Promise<void>;
  getTripsForItem(itemId: number): Promise<Trip[]>;

  // Session store
  sessionStore: session.Store;
}

// Use the database storage
export const storage = new DatabaseStorage();
