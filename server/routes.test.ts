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
        const items = mockItems.filter(item => item.status === 'checked_out');
        return Promise.resolve(items);
      }),
      // Add more mocked methods as needed
      sessionStore: {}
    }
  };
});

// Mock the logger
vi.mock('./logger', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    }
  };
});

// Mock authentication middleware
vi.mock('passport', () => {
  return {
    initialize: vi.fn(() => (req: any, res: any, next: any) => next()),
    session: vi.fn(() => (req: any, res: any, next: any) => next()),
    authenticate: vi.fn(() => (req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    }),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
    use: vi.fn()
  };
});

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
    it('returns only checked out items', async () => {
      const response = await request.get('/api/items/checked-out');
      
      expect(response.status).toBe(200);
      const checkedOutItems = mockItems.filter(item => item.status === 'checked_out');
      expect(response.body).toHaveLength(checkedOutItems.length);
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