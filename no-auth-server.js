/**
 * This is a simplified server script that bypasses authentication
 * for local development, allowing direct access to inventory management
 * functionality without login requirements.
 */

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

// Connect to PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    return false;
  }
}

// Middleware to create a mock user for all requests
app.use((req, res, next) => {
  req.user = {
    id: 1,
    username: 'admin'
  };
  req.isAuthenticated = () => true;
  next();
});

// API routes

// Items CRUD
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name, description, brand, category, owner, isShared, locationId, storageLocation, condition, imageUrls } = req.body;
    const result = await pool.query(
      'INSERT INTO items (name, description, brand, category, owner, is_shared, location_id, storage_location, condition, image_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [name, description, brand, category, owner, isShared, locationId, storageLocation, condition, imageUrls]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Failed to create item' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { name, description, brand, category, owner, isShared, locationId, storageLocation, condition, imageUrls } = req.body;
    const result = await pool.query(
      'UPDATE items SET name = $1, description = $2, brand = $3, category = $4, owner = $5, is_shared = $6, location_id = $7, storage_location = $8, condition = $9, image_urls = $10 WHERE id = $11 RETURNING *',
      [name, description, brand, category, owner, isShared, locationId, storageLocation, condition, imageUrls, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// Locations CRUD
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

app.get('/api/locations/with-counts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, COUNT(i.id) as items
      FROM locations l
      LEFT JOIN items i ON l.id = i.location_id
      GROUP BY l.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations with counts:', error);
    res.status(500).json({ message: 'Failed to fetch locations with counts' });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { name, address, description } = req.body;
    const result = await pool.query(
      'INSERT INTO locations (name, address, description) VALUES ($1, $2, $3) RETURNING *',
      [name, address, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Failed to create location' });
  }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { name, address, description } = req.body;
    const result = await pool.query(
      'UPDATE locations SET name = $1, address = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, address, description, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Failed to delete location' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM items');
    const availableResult = await pool.query('SELECT COUNT(*) FROM items WHERE id NOT IN (SELECT item_id FROM checkout_history WHERE return_date IS NULL)');
    const checkedOutResult = await pool.query('SELECT COUNT(*) FROM checkout_history WHERE return_date IS NULL');
    
    res.json({
      total: parseInt(totalResult.rows[0].count),
      available: parseInt(availableResult.rows[0].count),
      checkedOut: parseInt(checkedOutResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Mock user endpoint
app.get('/api/user', (req, res) => {
  res.json({
    id: 1,
    username: 'admin'
  });
});

// Serve static files from client/dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Serve index.html for all routes (for SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start the server
const PORT = process.env.PORT || 5000;
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log('⚠️  Starting server without database connection. Some features may not work.');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
====================================================
🚀 GEAR VAULT - NO AUTH VERSION FOR LOCAL DEVELOPMENT
====================================================
✅ Server running on http://localhost:${PORT}
✅ No authentication required - bypassing login screen
✅ Direct access to inventory management functionality

To access the application:
1. Open http://localhost:${PORT} in your browser
2. You will be automatically logged in as "admin"
3. Use all features without authentication

If you encounter issues:
- Check DATABASE_URL in your .env file
- Ensure PostgreSQL is running
- Check browser console for errors
====================================================
`);
  });
}

startServer();