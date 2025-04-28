import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertUserSchema, 
  insertItemSchema, 
  insertCheckoutHistorySchema,
  updateCheckoutHistorySchema
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Configure uploads
const upload = multer({ 
  dest: path.join(process.cwd(), "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), "uploads"))) {
  fs.mkdirSync(path.join(process.cwd(), "uploads"));
}

// Configure session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(session({
    secret: process.env.SESSION_SECRET || "gearshare-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      if (user.password !== password) { // In production, use proper password hashing
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Serve static files from uploads directory
  app.use("/api/uploads", (req, res, next) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }, express.static(path.join(process.cwd(), "uploads")));

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in successfully", user: req.user });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Item routes
  app.get("/api/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getItem(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.get("/api/items/owner/:owner", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getItemsByOwner(req.params.owner);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/shared", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getSharedItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared items" });
    }
  });

  app.get("/api/items/checked-out", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getCheckedOutItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checked out items" });
    }
  });

  app.post("/api/items", isAuthenticated, upload.array("images", 5), async (req, res) => {
    try {
      // Get uploaded file paths
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map(file => `/api/uploads/${file.filename}`);
      
      // Parse and validate item data
      const itemData = JSON.parse(req.body.item);
      const validatedItem = insertItemSchema.parse({
        ...itemData,
        imageUrls
      });
      
      const item = await storage.createItem(validatedItem);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid item data", error });
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
      
      // Add image URLs if files were uploaded
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const newImageUrls = files.map(file => `/api/uploads/${file.filename}`);
        // Combine existing and new images
        updateData.imageUrls = [...(existingItem.imageUrls || []), ...newImageUrls];
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

  const httpServer = createServer(app);
  return httpServer;
}
