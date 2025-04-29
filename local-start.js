/**
 * Helper script to run the no-auth server for local development
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('⚠️ No .env file found. Creating a template...');
  const envTemplate = `
# Database connection
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gearvault
SESSION_SECRET=local-dev-secret
  `.trim();
  
  fs.writeFileSync('.env', envTemplate);
  console.log('✅ Created .env template file. Please update with your database credentials.');
}

console.log('🚀 Starting GearVault in NO-AUTH mode for local development...');

// Run the no-auth server
const serverProcess = spawn('node', ['no-auth-server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server process exited with code ${code}`);
  }
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});