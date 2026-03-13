import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import logger from "./logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const isDev = process.env.NODE_ENV === "development";

// Ensure a dev user exists for local development
async function ensureDevUser(): Promise<SelectUser> {
  let user = await storage.getUserByUsername("dev");
  if (!user) {
    const hashedPassword = await hashPassword("dev");
    user = await storage.createUser({ username: "dev", password: hashedPassword });
    logger.info("Created default dev user (username: dev)");
  }
  return user;
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "gearshare-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy (username/password)
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // Google OAuth strategy (only if credentials are configured)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Check if user already exists with this Google ID
            let user = await storage.getUserByGoogleId(profile.id);

            if (user) {
              // Update profile info on each login
              user = await storage.updateUser(user.id, {
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value || user.email,
                avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
              }) || user;
              return done(null, user);
            }

            // Check if a user exists with the same email
            const email = profile.emails?.[0]?.value;
            if (email) {
              const existingUser = await storage.getUserByUsername(email);
              if (existingUser) {
                // Link Google account to existing user
                user = await storage.updateUser(existingUser.id, {
                  googleId: profile.id,
                  displayName: profile.displayName,
                  email,
                  avatarUrl: profile.photos?.[0]?.value,
                }) || existingUser;
                return done(null, user);
              }
            }

            // Create a new user
            const username = email || `google-${profile.id}`;
            const newUser = await storage.createUser({
              username,
              password: await hashPassword(randomBytes(32).toString("hex")), // Random password for OAuth users
            });

            user = await storage.updateUser(newUser.id, {
              googleId: profile.id,
              displayName: profile.displayName,
              email,
              avatarUrl: profile.photos?.[0]?.value,
            }) || newUser;

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        },
      ),
    );

    // Google OAuth routes
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }),
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (_req, res) => {
        res.redirect("/");
      },
    );

    logger.info("Google OAuth configured");
  } else if (process.env.NODE_ENV === "production") {
    logger.warn("Google OAuth not configured — GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set");
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // In development, auto-authenticate all requests as the dev user
  if (isDev) {
    logger.info("Development mode: auto-authenticating all requests as dev user");
    app.use(async (req, _res, next) => {
      if (!req.isAuthenticated()) {
        const devUser = await ensureDevUser();
        req.login(devUser, (err) => {
          if (err) return next(err);
          next();
        });
      } else {
        next();
      }
    });
  }

  // Endpoint to check if Google OAuth is available
  app.get("/api/auth/providers", (_req, res) => {
    res.json({
      local: true,
      google: !!(googleClientId && googleClientSecret),
    });
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...user } = req.user!;
    res.json(user);
  });
}
