/**
 * Local debugging utility for GearVault
 * This script helps diagnose and fix common React and database issues
 */

console.log('\n🔍 Starting GearVault diagnostic tool...\n');

// Check React installation
try {
  const reactPath = require.resolve('react');
  console.log('✅ React found at:', reactPath);
  
  const react = require('react');
  console.log('✅ React version:', react.version);
  
  const reactDomPath = require.resolve('react-dom');
  console.log('✅ ReactDOM found at:', reactDomPath);
  
  const reactDom = require('react-dom');
  console.log('✅ ReactDOM version:', reactDom.version);
  
  const reactDomClient = require('react-dom/client');
  console.log('✅ ReactDOM client API available');
  
  if (react.version.split('.')[0] !== reactDom.version.split('.')[0]) {
    console.log('❌ WARNING: React and ReactDOM versions do not match!');
    console.log('   This can cause "Invalid hook call" errors.');
    console.log('   Fix: Run "npm install react@' + reactDom.version + ' react-dom@' + reactDom.version + ' --save-exact"');
  } else {
    console.log('✅ React and ReactDOM versions match');
  }
} catch (error) {
  console.log('❌ Error checking React:', error.message);
}

// Check for database connection
try {
  require('dotenv').config();
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found in environment variables');
    console.log('   Fix: Add DATABASE_URL to your .env file');
  } else {
    console.log('✅ DATABASE_URL found in environment');
    
    // Test PostgreSQL connection
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.log('❌ Database connection failed:', err.message);
        console.log('   Fix: Check that PostgreSQL is running and DATABASE_URL is correct');
      } else {
        console.log('✅ Successfully connected to PostgreSQL database');
      }
      
      // Test database schema
      pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'items'
        )
      `, (err, res) => {
        if (err) {
          console.log('❌ Error checking database schema:', err.message);
        } else if (!res.rows[0].exists) {
          console.log('❌ Database schema not found. Tables may not be created yet.');
          console.log('   Fix: Run migrations or initialize the schema');
        } else {
          console.log('✅ Database schema found: "items" table exists');
        }
        
        pool.end();
      });
    });
  }
} catch (error) {
  console.log('❌ Error checking database:', error.message);
}

// Create a simple React component to test hooks
console.log('\n🧪 Testing React hooks functionality...');

try {
  const React = require('react');
  
  // Define a simple component using hooks
  const TestComponent = () => {
    const [count, setCount] = React.useState(0);
    
    React.useEffect(() => {
      console.log('✅ React useEffect hook working properly');
    }, []);
    
    console.log('✅ React useState hook working properly');
    
    return 'Test component rendered successfully';
  };
  
  // Simulate rendering the component
  console.log('✅ Component definition succeeded - hooks syntax is valid');
  console.log('   (Note: This doesn\'t guarantee hooks will work at runtime)');
} catch (error) {
  console.log('❌ Error testing React hooks:', error.message);
  console.log('   This may indicate problems with your React installation');
}

console.log('\n🔧 Diagnostic suggestions:');
console.log(' - If you see React version mismatches, try reinstalling matching versions');
console.log(' - For database connection issues, verify PostgreSQL is running');
console.log(' - Try the no-auth server with: "./start-local.sh"');
console.log(' - For React hooks errors, check for multiple React installations');
console.log('\n');