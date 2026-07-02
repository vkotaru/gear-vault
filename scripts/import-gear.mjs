#!/usr/bin/env node
/**
 * Bulk-import gear items into a running Gear Vault server.
 *
 * Reads a JSON file (an array of items), logs into the server, and creates each
 * item via POST /api/items — uploading photos from local files or remote URLs.
 *
 * Usage:
 *   node scripts/import-gear.mjs \
 *     --server http://100.103.152.47:5001 \
 *     --user <username> --pass <password> \
 *     path/to/gear.json
 *
 * Each item in gear.json:
 *   {
 *     "name": "4-Person Dome Tent",       // required
 *     "category": "camping",               // required: camping|hiking|biking|water|winter|other
 *     "brand": "REI Co-op",                // optional
 *     "description": "...",                // optional
 *     "owner": "you",                      // optional (defaults to --user)
 *     "storageLocation": "Unsorted",       // optional (defaults to "Unsorted")
 *     "storageAddress": "...",             // optional
 *     "condition": "Good",                 // optional (Excellent|Good|Fair|Poor)
 *     "isShared": true,                     // optional (default true)
 *     "status": "available",               // optional
 *     "addedOn": "2023-06-15",             // optional purchase date (ISO); defaults to now
 *     "images": ["photos/tent.jpg", "https://.../tent.jpg"]  // local paths (relative to the JSON) or URLs
 *   }
 */

import { readFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, resolve } from "node:path";

const VALID_CATEGORIES = ["camping", "hiking", "biking", "water", "winter", "other"];

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--server" || a === "--user" || a === "--pass") {
      args[a.slice(2)] = argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function loadImage(img, jsonDir) {
  if (/^https?:\/\//i.test(img)) {
    const res = await fetch(img);
    if (!res.ok) throw new Error(`download failed (${res.status}) for ${img}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const name = basename(new URL(img).pathname) || "image.jpg";
    return { buf, name };
  }
  const p = isAbsolute(img) ? img : resolve(jsonDir, img);
  const buf = await readFile(p);
  return { buf, name: basename(p) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const server = (args.server || process.env.GEARVAULT_SERVER || "").replace(/\/$/, "");
  const user = args.user || process.env.GEARVAULT_USER;
  const pass = args.pass || process.env.GEARVAULT_PASS;
  const jsonPath = args._[0];

  if (!server || !user || !pass || !jsonPath) {
    console.error("Usage: node scripts/import-gear.mjs --server <url> --user <u> --pass <p> <gear.json>");
    process.exit(1);
  }

  const jsonDir = dirname(resolve(jsonPath));
  const items = JSON.parse(await readFile(jsonPath, "utf-8"));
  if (!Array.isArray(items)) throw new Error("gear.json must be an array of items");

  // Log in and capture the session cookie.
  const loginRes = await fetch(`${server}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });
  if (!loginRes.ok) {
    console.error(`Login failed (${loginRes.status}). Check --user/--pass and --server.`);
    process.exit(1);
  }
  const setCookie = loginRes.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : "";
  if (!cookie) {
    console.error("No session cookie returned by /api/login.");
    process.exit(1);
  }

  let ok = 0;
  const failures = [];

  for (const [i, raw] of items.entries()) {
    const label = raw.name || `item #${i + 1}`;
    try {
      if (!raw.name) throw new Error("missing 'name'");
      if (!VALID_CATEGORIES.includes(raw.category)) {
        throw new Error(`invalid category '${raw.category}' (use ${VALID_CATEGORIES.join("/")})`);
      }

      const { images = [], imageUrls, ...fields } = raw;

      // Apply sensible defaults; anything in the JSON overrides these.
      const itemPayload = {
        owner: user,
        storageLocation: "Unsorted",
        isShared: true,
        condition: "Good",
        status: "available",
        ...fields,
      };

      const form = new FormData();
      for (const img of images) {
        const { buf, name } = await loadImage(img, jsonDir);
        form.append("images", new Blob([buf]), name);
      }
      form.append("item", JSON.stringify(itemPayload));

      const res = await fetch(`${server}/api/items`, {
        method: "POST",
        headers: { Cookie: cookie },
        body: form,
      });
      if (!res.ok) throw new Error(`server responded ${res.status}: ${await res.text()}`);

      const created = await res.json();
      ok++;
      console.log(`✓ [${i + 1}/${items.length}] ${label} (id ${created.id}, ${images.length} photo(s))`);
    } catch (err) {
      failures.push({ label, error: err.message });
      console.error(`✗ [${i + 1}/${items.length}] ${label}: ${err.message}`);
    }
  }

  console.log(`\nDone. Imported ${ok}/${items.length}.`);
  if (failures.length) {
    console.log(`Failed: ${failures.length}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
