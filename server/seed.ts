import { storage } from "./storage";
import logger from "./logger";

const CATEGORIES = ["camping", "hiking", "biking", "water", "winter", "other"] as const;
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

// Category colors for placeholder images
const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  camping: { bg: "2d5016", fg: "e8f5e9" },
  hiking: { bg: "5d4037", fg: "efebe9" },
  biking: { bg: "b71c1c", fg: "ffebee" },
  water: { bg: "0d47a1", fg: "e3f2fd" },
  winter: { bg: "37474f", fg: "eceff1" },
  other: { bg: "4a148c", fg: "f3e5f5" },
};

function placeholderImg(name: string, category: string): string[] {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const text = encodeURIComponent(name);
  return [
    `https://placehold.co/800x600/${colors.bg}/${colors.fg}?text=${text}`,
  ];
}

const GEAR_DATA = [
  { name: "4-Person Dome Tent", brand: "REI Co-op", category: "camping" as const, description: "Spacious dome tent with full rain fly and vestibule" },
  { name: "Ultralight Backpacking Tent", brand: "Big Agnes", category: "camping" as const, description: "2-person freestanding tent, packs down to 3 lbs" },
  { name: "Camping Hammock", brand: "ENO", category: "camping" as const, description: "Double nest hammock with carabiners and straps" },
  { name: "Sleeping Bag 20F", brand: "Kelty", category: "camping" as const, description: "Synthetic fill mummy bag rated to 20°F" },
  { name: "Camp Stove", brand: "MSR", category: "camping" as const, description: "Compact 2-burner propane stove" },
  { name: "Headlamp 350 Lumen", brand: "Black Diamond", category: "camping" as const, description: "Rechargeable headlamp with red light mode" },
  { name: "Trail Running Shoes", brand: "Salomon", category: "hiking" as const, description: "Lightweight trail runners with Contagrip sole" },
  { name: "Hiking Boots", brand: "Merrell", category: "hiking" as const, description: "Waterproof mid-cut boots with Vibram outsole" },
  { name: "Trekking Poles", brand: "Black Diamond", category: "hiking" as const, description: "Carbon fiber collapsible poles with cork grips" },
  { name: "Daypack 30L", brand: "Osprey", category: "hiking" as const, description: "Ventilated back panel, rain cover included" },
  { name: "Backpacking Pack 65L", brand: "Gregory", category: "hiking" as const, description: "Adjustable torso length with hip belt pockets" },
  { name: "Water Filter", brand: "Sawyer", category: "hiking" as const, description: "Squeeze filter removes 99.99% of bacteria" },
  { name: "Mountain Bike", brand: "Trek", category: "biking" as const, description: "Full suspension trail bike, 29er wheels" },
  { name: "Road Bike", brand: "Specialized", category: "biking" as const, description: "Carbon frame, Shimano 105 groupset" },
  { name: "Bike Helmet", brand: "Giro", category: "biking" as const, description: "MIPS-equipped trail helmet" },
  { name: "Bike Repair Kit", brand: "Park Tool", category: "biking" as const, description: "Multi-tool, tire levers, patch kit, and mini pump" },
  { name: "Kayak", brand: "Pelican", category: "water" as const, description: "10ft recreational sit-in kayak" },
  { name: "Inflatable SUP", brand: "iROCKER", category: "water" as const, description: "11ft all-around paddle board with pump and paddle" },
  { name: "Dry Bag 20L", brand: "Sea to Summit", category: "water" as const, description: "Roll-top waterproof bag for gear protection" },
  { name: "Life Jacket", brand: "Stohlquist", category: "water" as const, description: "Type III PFD with adjustable straps" },
  { name: "Snowboard 156cm", brand: "Burton", category: "winter" as const, description: "All-mountain directional twin board" },
  { name: "Ski Boots", brand: "Salomon", category: "winter" as const, description: "All-mountain boots, 100mm last, flex 100" },
  { name: "Snowshoes", brand: "MSR", category: "winter" as const, description: "25-inch aluminum frame snowshoes with crampons" },
  { name: "Ski Goggles", brand: "Smith", category: "winter" as const, description: "ChromaPop lens with anti-fog coating" },
  { name: "Climbing Harness", brand: "Petzl", category: "other" as const, description: "Adjustable sport climbing harness with gear loops" },
  { name: "Climbing Rope 60m", brand: "Sterling", category: "other" as const, description: "9.8mm dynamic single rope, dry treated" },
  { name: "GPS Watch", brand: "Garmin", category: "other" as const, description: "Multisport GPS watch with topo maps" },
  { name: "Bear Canister", brand: "BearVault", category: "camping" as const, description: "Approved bear-resistant food container, 7-day capacity" },
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
    // Backfill placeholder images on items that have none
    const itemsWithoutImages = existingItems.filter(
      (item) => !item.imageUrls || item.imageUrls.length === 0
    );
    if (itemsWithoutImages.length > 0) {
      logger.info(`Backfilling placeholder images on ${itemsWithoutImages.length} items...`);
      for (const item of itemsWithoutImages) {
        const gearMatch = GEAR_DATA.find((g) => g.name === item.name);
        const urls = placeholderImg(
          item.name,
          gearMatch?.category || item.category || "other"
        );
        await storage.updateItem(item.id, { imageUrls: urls });
      }
      logger.info("Placeholder images backfilled");
    }
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
      imageUrls: placeholderImg(gear.name, gear.category),
    });
    created++;
  }

  logger.info(`Seeded ${created} gear items`);
}
