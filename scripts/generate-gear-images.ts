import * as fs from "fs";
import * as path from "path";
import { pool } from "../server/db";
import { storage } from "../server/storage";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Search terms mapped to each gear item for finding relevant photos
const GEAR_SEARCH_TERMS: Record<string, string> = {
  "4-Person Dome Tent": "camping tent outdoor",
  "Ultralight Backpacking Tent": "backpacking tent mountain",
  "Camping Hammock": "camping hammock trees",
  "Sleeping Bag 20F": "sleeping bag camping",
  "Camp Stove": "camping stove cooking outdoor",
  "Headlamp 350 Lumen": "headlamp hiking night",
  "Trail Running Shoes": "trail running shoes",
  "Hiking Boots": "hiking boots outdoor",
  "Trekking Poles": "trekking poles hiking",
  "Daypack 30L": "hiking backpack daypack",
  "Backpacking Pack 65L": "backpacking pack hiking",
  "Water Filter": "water filter hiking outdoor",
  "Mountain Bike": "mountain bike trail",
  "Road Bike": "road bike cycling",
  "Bike Helmet": "bike helmet cycling",
  "Bike Repair Kit": "bike repair tools",
  "Kayak": "kayak water paddle",
  "Inflatable SUP": "stand up paddle board",
  "Dry Bag 20L": "dry bag waterproof outdoor",
  "Life Jacket": "life jacket kayak",
  "Snowboard 156cm": "snowboard winter snow",
  "Ski Boots": "ski boots winter",
  "Snowshoes": "snowshoes winter hiking",
  "Ski Goggles": "ski goggles snow",
  "Climbing Harness": "climbing harness rock",
  "Climbing Rope 60m": "climbing rope outdoor",
  "GPS Watch": "gps watch outdoor sport",
  "Bear Canister": "bear canister camping food",
};

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buf);
  return true;
}

async function findAndDownloadImage(
  itemName: string,
  searchQuery: string
): Promise<string | null> {
  const filename = `gear-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);

  // Use Pexels API (free, no key required for small resolution via their static URLs)
  // Actually use Unsplash source which redirects to a relevant photo
  const query = encodeURIComponent(searchQuery);

  // Try downloading from multiple free sources
  const sources = [
    `https://source.unsplash.com/800x600/?${query}`,
    `https://loremflickr.com/800/600/${query.replace(/%20/g, ",")}`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok && res.headers.get("content-type")?.startsWith("image")) {
        const buf = Buffer.from(await res.arrayBuffer());
        // Make sure we got a real image (> 5KB)
        if (buf.length > 5000) {
          fs.writeFileSync(filepath, buf);
          console.log(`  ✓ Downloaded: ${filename} (${Math.round(buf.length / 1024)}KB)`);
          return `/api/uploads/${filename}`;
        }
      }
    } catch (err: any) {
      console.log(`  ✗ ${url.split("?")[0]}: ${err.message?.slice(0, 80)}`);
    }
  }

  return null;
}

async function main() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const items = await storage.getAllItems();
  console.log(`Found ${items.length} items. Downloading images...\n`);

  let success = 0;
  let failed = 0;

  for (const item of items) {
    if (item.imageUrls?.some((url) => url.startsWith("/api/uploads/gear-"))) {
      console.log(`  – Skipping (already has image): ${item.name}`);
      continue;
    }

    const searchQuery = GEAR_SEARCH_TERMS[item.name] || item.name;
    console.log(`[${success + failed + 1}/${items.length}] ${item.name}`);

    const imageUrl = await findAndDownloadImage(item.name, searchQuery);

    if (imageUrl) {
      await storage.updateItem(item.id, { imageUrls: [imageUrl] });
      success++;
    } else {
      failed++;
    }

    // Small delay to be respectful
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone! Downloaded: ${success}, Failed: ${failed}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
