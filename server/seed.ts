import { storage } from "./storage";
import logger from "./logger";

const CATEGORIES = ["camping", "hiking", "biking", "water", "winter", "other"] as const;
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

const GEAR_DATA: { name: string; brand: string; category: typeof CATEGORIES[number]; description: string }[] = [
  { name: "4-Person Dome Tent", brand: "REI Co-op", category: "camping", description: "Spacious dome tent with full rain fly and vestibule" },
  { name: "Ultralight Backpacking Tent", brand: "Big Agnes", category: "camping", description: "2-person freestanding tent, packs down to 3 lbs" },
  { name: "Camping Hammock", brand: "ENO", category: "camping", description: "Double nest hammock with carabiners and straps" },
  { name: "Sleeping Bag 20F", brand: "Kelty", category: "camping", description: "Synthetic fill mummy bag rated to 20°F" },
  { name: "Camp Stove", brand: "MSR", category: "camping", description: "Compact 2-burner propane stove" },
  { name: "Headlamp 350 Lumen", brand: "Black Diamond", category: "camping", description: "Rechargeable headlamp with red light mode" },
  { name: "Trail Running Shoes", brand: "Salomon", category: "hiking", description: "Lightweight trail runners with Contagrip sole" },
  { name: "Hiking Boots", brand: "Merrell", category: "hiking", description: "Waterproof mid-cut boots with Vibram outsole" },
  { name: "Trekking Poles", brand: "Black Diamond", category: "hiking", description: "Carbon fiber collapsible poles with cork grips" },
  { name: "Daypack 30L", brand: "Osprey", category: "hiking", description: "Ventilated back panel, rain cover included" },
  { name: "Backpacking Pack 65L", brand: "Gregory", category: "hiking", description: "Adjustable torso length with hip belt pockets" },
  { name: "Water Filter", brand: "Sawyer", category: "hiking", description: "Squeeze filter removes 99.99% of bacteria" },
  { name: "Mountain Bike", brand: "Trek", category: "biking", description: "Full suspension trail bike, 29er wheels" },
  { name: "Road Bike", brand: "Specialized", category: "biking", description: "Carbon frame, Shimano 105 groupset" },
  { name: "Bike Helmet", brand: "Giro", category: "biking", description: "MIPS-equipped trail helmet" },
  { name: "Bike Repair Kit", brand: "Park Tool", category: "biking", description: "Multi-tool, tire levers, patch kit, and mini pump" },
  { name: "Kayak", brand: "Pelican", category: "water", description: "10ft recreational sit-in kayak" },
  { name: "Inflatable SUP", brand: "iROCKER", category: "water", description: "11ft all-around paddle board with pump and paddle" },
  { name: "Dry Bag 20L", brand: "Sea to Summit", category: "water", description: "Roll-top waterproof bag for gear protection" },
  { name: "Life Jacket", brand: "Stohlquist", category: "water", description: "Type III PFD with adjustable straps" },
  { name: "Snowboard 156cm", brand: "Burton", category: "winter", description: "All-mountain directional twin board" },
  { name: "Ski Boots", brand: "Salomon", category: "winter", description: "All-mountain boots, 100mm last, flex 100" },
  { name: "Snowshoes", brand: "MSR", category: "winter", description: "25-inch aluminum frame snowshoes with crampons" },
  { name: "Ski Goggles", brand: "Smith", category: "winter", description: "ChromaPop lens with anti-fog coating" },
  { name: "Climbing Harness", brand: "Petzl", category: "other", description: "Adjustable sport climbing harness with gear loops" },
  { name: "Climbing Rope 60m", brand: "Sterling", category: "other", description: "9.8mm dynamic single rope, dry treated" },
  { name: "GPS Watch", brand: "Garmin", category: "other", description: "Multisport GPS watch with topo maps" },
  { name: "Bear Canister", brand: "BearVault", category: "camping", description: "Approved bear-resistant food container, 7-day capacity" },
];

const LOCATIONS_DATA = [
  { name: "Home Garage", address: "123 Main St", description: "Main storage area for large gear" },
  { name: "Hall Closet", address: "123 Main St", description: "Smaller items and accessories" },
  { name: "Storage Unit #42", address: "500 Storage Blvd", description: "Off-site unit for seasonal gear" },
  { name: "Basement", address: "123 Main St", description: "Climate-controlled storage for sensitive equipment" },
];

const OWNERS = ["dev", "Alex", "Jordan"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedDevData() {
  // Check if data already exists
  const existingItems = await storage.getAllItems();
  if (existingItems.length > 0) {
    logger.info(`Database already has ${existingItems.length} items, skipping seed`);
    return;
  }

  logger.info("Seeding database with sample data...");

  // Create locations
  const createdLocations = [];
  for (const loc of LOCATIONS_DATA) {
    const location = await storage.createLocation(loc);
    createdLocations.push(location);
  }
  logger.info(`Created ${createdLocations.length} locations`);

  // Create items
  let created = 0;
  for (const gear of GEAR_DATA) {
    const location = pick(createdLocations);
    const isCheckedOut = Math.random() < 0.15; // ~15% checked out

    await storage.createItem({
      name: gear.name,
      brand: gear.brand,
      category: gear.category,
      description: gear.description,
      owner: pick(OWNERS),
      isShared: Math.random() < 0.7,
      locationId: location.id,
      storageLocation: location.name,
      storageAddress: location.address,
      condition: pick(CONDITIONS),
      status: isCheckedOut ? "checked_out" : "available",
      imageUrls: [],
    });
    created++;
  }

  logger.info(`Seeded ${created} gear items`);
}
