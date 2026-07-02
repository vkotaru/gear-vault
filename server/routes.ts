import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { randomBytes } from "crypto";
import { 
  insertUserSchema, 
  insertItemSchema, 
  insertCheckoutHistorySchema,
  updateCheckoutHistorySchema,
  insertLocationSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import logger from "./logger";

// Directory where uploaded images are stored. Configurable via UPLOADS_DIR so
// it can point at a persistent volume in production (e.g. a Railway Volume
// mounted at /data/uploads); local dev falls back to ./uploads.
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist (recursive for nested mount paths)
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure uploads. Preserve the file extension so the static server sends a
// correct Content-Type (e.g. image/jpeg) rather than application/octet-stream.
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Bulk-import archive upload (kept in memory so we can unzip it).
const archiveUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Application version, read from package.json at startup (bundled server runs
// from /app where package.json is present).
let appVersion = "unknown";
try {
  appVersion = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
  ).version || "unknown";
} catch (error) {
  logger.warn("Could not read app version from package.json", { error });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check (unauthenticated) — used by platform healthchecks (Railway).
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: appVersion });
  });

  // Setup authentication
  setupAuth(app);

  // Serve static files from uploads directory
  app.use("/api/uploads", (req, res, next) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }, express.static(uploadsDir));

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Additional auth routes
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Item routes
  app.get("/api/items", isAuthenticated, async (req, res) => {
    logger.info("GET /api/items - Fetching all items");
    try {
      const items = await storage.getAllItems();
      logger.debug(`GET /api/items - Found ${items.length} items`);
      res.json(items);
    } catch (error) {
      logger.error("GET /api/items - Error fetching items", { error });
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // Specific routes come before wildcard routes
  app.get("/api/items/owner/:owner", isAuthenticated, async (req, res) => {
    const owner = req.params.owner;
    logger.info(`GET /api/items/owner/${owner} - Fetching items by owner`);
    try {
      const items = await storage.getItemsByOwner(owner);
      logger.debug(`GET /api/items/owner/${owner} - Found ${items.length} items`);
      res.json(items);
    } catch (error) {
      logger.error(`GET /api/items/owner/${owner} - Error fetching items`, { error });
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/shared", isAuthenticated, async (req, res) => {
    logger.info("GET /api/items/shared - Fetching shared items");
    try {
      const items = await storage.getSharedItems();
      logger.debug(`GET /api/items/shared - Found ${items.length} shared items`);
      res.json(items);
    } catch (error) {
      logger.error("GET /api/items/shared - Error fetching shared items", { error });
      res.status(500).json({ message: "Failed to fetch shared items" });
    }
  });

  app.get("/api/items/checked-out", isAuthenticated, async (req, res) => {
    logger.info("GET /api/items/checked-out - Fetching checked out items");
    try {
      const items = await storage.getCheckedOutItems();
      logger.debug(`GET /api/items/checked-out - Found ${items.length} checked out items`);
      res.json(items);
    } catch (error) {
      logger.error("GET /api/items/checked-out - Error fetching checked out items", { error });
      res.status(500).json({ message: "Failed to fetch checked out items" });
    }
  });
  
  // Now the generic ID endpoint comes after the more specific routes
  app.get("/api/items/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    logger.info(`GET /api/items/${id} - Fetching item by ID`);
    try {
      const item = await storage.getItem(id);
      if (!item) {
        logger.warn(`GET /api/items/${id} - Item not found`);
        return res.status(404).json({ message: "Item not found" });
      }
      logger.debug(`GET /api/items/${id} - Item found`, { itemId: id });
      res.json(item);
    } catch (error) {
      logger.error(`GET /api/items/${id} - Error fetching item`, { error, itemId: id });
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", isAuthenticated, upload.array("images", 5), async (req, res) => {
    logger.info("POST /api/items - Creating new item");
    try {
      // Get uploaded file paths
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map(file => `/api/uploads/${file.filename}`);
      logger.debug(`POST /api/items - Processed ${files.length} uploaded images`);
      
      // Parse and validate item data
      const itemData = JSON.parse(req.body.item);
      logger.debug("POST /api/items - Received item data", { itemData });
      
      const validatedItem = insertItemSchema.parse({
        ...itemData,
        imageUrls
      });
      
      const item = await storage.createItem(validatedItem);
      logger.info(`POST /api/items - Item created successfully with ID ${item.id}`);
      res.status(201).json(item);
    } catch (error) {
      logger.error("POST /api/items - Error creating item", { error });
      res.status(400).json({ message: "Invalid item data", error });
    }
  });

  // Bulk import: a .zip containing gear.json (array of items) and referenced
  // photo files. Each item's photos are extracted to the uploads dir.
  app.post("/api/items/import", isAuthenticated, archiveUpload.single("archive"), async (req, res) => {
    logger.info("POST /api/items/import - Importing gear archive");
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No archive uploaded" });
      }

      let zip: AdmZip;
      try {
        zip = new AdmZip(req.file.buffer);
      } catch {
        return res.status(400).json({ message: "Uploaded file is not a valid zip archive" });
      }

      const entries = zip.getEntries();
      const jsonEntry = entries.find(
        (e) => !e.isDirectory && path.basename(e.entryName) === "gear.json"
      );
      if (!jsonEntry) {
        return res.status(400).json({ message: "gear.json not found in the archive" });
      }

      let items: any[];
      try {
        items = JSON.parse(zip.readAsText(jsonEntry));
      } catch {
        return res.status(400).json({ message: "gear.json is not valid JSON" });
      }
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "gear.json must be an array of items" });
      }

      const username = req.user!.username;
      const results = {
        imported: 0,
        failed: 0,
        errors: [] as { item: string; error: string }[],
      };

      for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        const label = raw?.name || `item #${i + 1}`;
        try {
          // Resolve each referenced photo within the archive and persist it.
          const imageRefs: string[] = Array.isArray(raw?.images) ? raw.images : [];
          const imageUrls: string[] = [];
          for (const ref of imageRefs) {
            const entry = entries.find(
              (e) =>
                !e.isDirectory &&
                (e.entryName === ref ||
                  e.entryName.endsWith(`/${ref}`) ||
                  path.basename(e.entryName) === path.basename(ref))
            );
            if (!entry) throw new Error(`image not found in archive: ${ref}`);
            const ext = path.extname(entry.entryName) || "";
            const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
            await fs.promises.writeFile(path.join(uploadsDir, filename), entry.getData());
            imageUrls.push(`/api/uploads/${filename}`);
          }

          const { images, imageUrls: _ignored, ...fields } = raw;
          const validatedItem = insertItemSchema.parse({
            owner: username,
            storageLocation: "Unsorted",
            isShared: true,
            condition: "Good",
            status: "available",
            ...fields,
            imageUrls,
          });
          const created = await storage.createItem(validatedItem);
          results.imported++;
          logger.info(`POST /api/items/import - Imported "${created.name}" (id ${created.id})`);
        } catch (err: any) {
          results.failed++;
          results.errors.push({ item: label, error: err?.message || String(err) });
          logger.warn(`POST /api/items/import - Failed to import ${label}`, { error: err });
        }
      }

      logger.info(`POST /api/items/import - Done: ${results.imported} imported, ${results.failed} failed`);
      res.json(results);
    } catch (error) {
      logger.error("POST /api/items/import - Error importing archive", { error });
      res.status(500).json({ message: "Failed to import archive" });
    }
  });

  app.put("/api/items/:id", isAuthenticated, upload.array("images", 5), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingItem = await storage.getItem(id);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      let updateData: any = {};

      // If there's a JSON item data
      if (req.body.item) {
        updateData = JSON.parse(req.body.item);
      }

      // Determine the final image list: the client sends the images it wants to
      // keep (removals are simply omitted); newly uploaded files are appended.
      const keptImages: string[] = Array.isArray(updateData.imageUrls)
        ? updateData.imageUrls
        : (existingItem.imageUrls || []);
      const files = req.files as Express.Multer.File[];
      const newImageUrls = (files || []).map(file => `/api/uploads/${file.filename}`);
      updateData.imageUrls = [...keptImages, ...newImageUrls];

      // Best-effort cleanup: delete locally-stored files that are no longer
      // referenced (ignore external URLs like placeholders).
      const removed = (existingItem.imageUrls || []).filter(
        (url) => !updateData.imageUrls.includes(url) && url.startsWith("/api/uploads/")
      );
      for (const url of removed) {
        const filePath = path.join(uploadsDir, path.basename(url));
        fs.promises.unlink(filePath).catch((error) => {
          logger.warn("Could not delete removed image file", { error, filePath });
        });
      }

      const updatedItem = await storage.updateItem(id, updateData);
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update item", error });
    }
  });

  app.delete("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteItem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Checkout routes
  app.get("/api/checkout/:itemId", isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getCheckoutHistory(parseInt(req.params.itemId));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checkout history" });
    }
  });

  app.post("/api/checkout", isAuthenticated, async (req, res) => {
    try {
      const checkoutData = insertCheckoutHistorySchema.parse(req.body);
      const checkout = await storage.checkoutItem(checkoutData);
      res.status(201).json(checkout);
    } catch (error) {
      res.status(400).json({ message: "Invalid checkout data", error });
    }
  });

  app.post("/api/return/:itemId", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const returnData = updateCheckoutHistorySchema.parse(req.body);
      const updated = await storage.returnItem(itemId, returnData);
      
      if (!updated) {
        return res.status(404).json({ message: "No active checkout found for this item" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid return data", error });
    }
  });

  // Stats routes
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const allItems = await storage.getAllItems();
      const availableItems = allItems.filter(item => item.status === "available");
      const checkedOutItems = allItems.filter(item => item.status === "checked_out");
      
      res.json({
        total: allItems.length,
        available: availableItems.length,
        checkedOut: checkedOutItems.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Location routes
  app.get("/api/locations", isAuthenticated, async (req, res) => {
    logger.info("GET /api/locations - Fetching all locations with item counts");
    try {
      const locations = await storage.getAllLocationsWithItemCounts();
      logger.debug(`GET /api/locations - Found ${locations.length} locations`);
      res.json(locations);
    } catch (error) {
      logger.error("GET /api/locations - Error fetching locations", { error });
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    logger.info(`GET /api/locations/${id} - Fetching location by ID with item count`);
    try {
      const location = await storage.getLocationWithItemCount(id);
      if (!location) {
        logger.warn(`GET /api/locations/${id} - Location not found`);
        return res.status(404).json({ message: "Location not found" });
      }
      logger.debug(`GET /api/locations/${id} - Location found`, { locationId: id });
      res.json(location);
    } catch (error) {
      logger.error(`GET /api/locations/${id} - Error fetching location`, { error, locationId: id });
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", isAuthenticated, async (req, res) => {
    logger.info("POST /api/locations - Creating new location");
    try {
      const validatedLocation = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedLocation);
      logger.info(`POST /api/locations - Location created successfully with ID ${location.id}`);
      res.status(201).json(location);
    } catch (error) {
      logger.error("POST /api/locations - Error creating location", { error });
      res.status(400).json({ message: "Invalid location data", error });
    }
  });

  app.put("/api/locations/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    logger.info(`PUT /api/locations/${id} - Updating location`);
    try {
      const existingLocation = await storage.getLocation(id);
      
      if (!existingLocation) {
        logger.warn(`PUT /api/locations/${id} - Location not found`);
        return res.status(404).json({ message: "Location not found" });
      }
      
      const validatedLocation = insertLocationSchema.parse(req.body);
      const updatedLocation = await storage.updateLocation(id, validatedLocation);
      
      logger.info(`PUT /api/locations/${id} - Location updated successfully`);
      res.json(updatedLocation);
    } catch (error) {
      logger.error(`PUT /api/locations/${id} - Error updating location`, { error, locationId: id });
      res.status(400).json({ message: "Failed to update location", error });
    }
  });

  app.delete("/api/locations/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    logger.info(`DELETE /api/locations/${id} - Deleting location`);
    try {
      const success = await storage.deleteLocation(id);
      
      if (!success) {
        logger.warn(`DELETE /api/locations/${id} - Location not found or has associated items`);
        return res.status(400).json({ 
          message: "Cannot delete location. It may not exist or has items associated with it." 
        });
      }
      
      logger.info(`DELETE /api/locations/${id} - Location deleted successfully`);
      res.json({ success });
    } catch (error) {
      logger.error(`DELETE /api/locations/${id} - Error deleting location`, { error, locationId: id });
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
