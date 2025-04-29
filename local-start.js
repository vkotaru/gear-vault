// Script to help start the application in local development environment
require('dotenv').config();
const { execSync } = require('child_process');

// Display helpful information
console.log('\n===== Starting Gear Vault in Local Development Mode =====');
console.log('Make sure you have:');
console.log('1. PostgreSQL running on your system');
console.log('2. A database created for this application');
console.log('3. Proper DATABASE_URL in your .env file\n');

// Check environment variables
if (!process.env.DATABASE_URL) {
  console.error('\nERROR: DATABASE_URL is not set in your .env file');
  console.log('Example .env file:');
  console.log('DATABASE_URL=postgresql://username:password@localhost:5432/databasename');
  console.log('SESSION_SECRET=your-secret-string');
  process.exit(1);
}

console.log('Starting application...');
try {
  execSync('NODE_ENV=development tsx server/index.ts', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Force React to use the development build
      NODE_ENV: 'development'
    }
  });
} catch (error) {
  console.error('\nApplication crashed:', error);
}