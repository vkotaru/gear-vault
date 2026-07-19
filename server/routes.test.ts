import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { mockItems } from '../client/src/__mocks__/data';
import { mockUser } from '../client/src/__mocks__/auth';

// Mock the storage interface
vi.mock('./storage', () => {
  return {
    storage: {
      getAllItems: vi.fn(() => Promise.resolve(mockItems)),
      getItem: vi.fn((id: number) => {
        const item = mockItems.find(item => item.id === id);
        return Promise.resolve(item);
      }),
      getItemsByOwner: vi.fn((owner: string) => {
        const items = mockItems.filter(item => item.owner === owner);
        return Promise.resolve(items);
      }),
      getSharedItems: vi.fn(() => {
        const items = mockItems.filter(item => item.isShared);
        return Promise.resolve(items);
      }),
      getCheckedOutItems: vi.fn(() => {
        const items = mockItems.filter(item => item.status === 'lent');
        return Promise.resolve(items);
      }),
      // Minimal express-session store: needs .on() at setup and the CRUD hooks.
      sessionStore: {
        on: vi.fn(),
        get: vi.fn((_sid: string, cb: any) => cb(null, null)),
        set: vi.fn((_sid: string, _sess: any, cb: any) => cb && cb(null)),
        destroy: vi.fn((_sid: string, cb: any) => cb && cb(null)),
        touch: vi.fn((_sid: string, _sess: any, cb: any) => cb && cb(null)),
      }
    }
  };
});

// Mock express-session to a no-op passthrough — these tests exercise
// route -> storage, not session handling, and the real middleware would try to
// use the (mocked) session store.
vi.mock('express-session', () => {
  const session: any = () => (req: any, _res: any, next: any) => {
    req.session = {};
    next();
  };
  session.Store = class {};
  return { default: session };
});

// Mock the logger. routes.ts imports it as a default export, so expose both.
vi.mock('./logger', () => {
  const logger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() };
  return { logger, default: logger };
});

// Note: passport is intentionally NOT mocked. With storage and express-session
// mocked and the test middleware below setting req.user/req.isAuthenticated,
// real passport is a harmless passthrough for these unauthenticated-path GETs
// (mocking it caused request hangs).

describe('API Routes', () => {
  let app: express.Express;
  let server: any;
  let request: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mock isAuthenticated middleware
    app.use((req: any, res: any, next: any) => {
      req.isAuthenticated = vi.fn(() => true);
      req.user = mockUser;
      next();
    });

    server = await registerRoutes(app);
    request = supertest(app);
  });

  afterAll(() => {
    if (server && server.close) {
      server.close();
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('returns all items', async () => {
      const response = await request.get('/api/items');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(mockItems.length);
      expect(response.body[0].name).toBe(mockItems[0].name);
    });
  });

  describe('GET /api/items/shared', () => {
    it('returns only shared items', async () => {
      const response = await request.get('/api/items/shared');
      
      expect(response.status).toBe(200);
      const sharedItems = mockItems.filter(item => item.isShared);
      expect(response.body).toHaveLength(sharedItems.length);
    });
  });

  describe('GET /api/items/checked-out', () => {
    it('returns only lent-out items', async () => {
      const response = await request.get('/api/items/checked-out');

      expect(response.status).toBe(200);
      const lentItems = mockItems.filter(item => item.status === 'lent');
      expect(response.body).toHaveLength(lentItems.length);
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns a specific item by id', async () => {
      const response = await request.get('/api/items/1');
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.name).toBe(mockItems[0].name);
    });

    it('returns 404 for non-existent item', async () => {
      const response = await request.get('/api/items/999');
      
      expect(response.status).toBe(404);
    });
  });
});