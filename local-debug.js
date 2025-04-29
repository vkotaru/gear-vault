// Local development debug script
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n===== Local Development Debug Helper =====');

// 1. Check React version compatibility
console.log('\nChecking React versions...');
try {
  const output = execSync('npm list react react-dom', { encoding: 'utf8' });
  console.log(output);
  
  if (output.includes('UNMET PEER DEPENDENCY')) {
    console.log('\n⚠️  WARNING: You have unmet peer dependencies. This might cause React hooks errors.');
  }
} catch (error) {
  console.error('Error checking React versions:', error.message);
}

// 2. Create a simplified React test file
const testComponentPath = path.join(__dirname, 'test-component.jsx');
const testComponentContent = `
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Simple test component to verify React hooks
function TestComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);
  
  return (
    <div>
      <h1>React Hooks Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Render the test component
const container = document.getElementById('root');
if (container) {
  ReactDOM.render(<TestComponent />, container);
} else {
  console.error('Root element not found');
}
`;

try {
  fs.writeFileSync(testComponentPath, testComponentContent);
  console.log(`\nCreated test component at ${testComponentPath}`);
  console.log('Try running this simple component to test if React hooks work properly on your system.');
} catch (error) {
  console.error('Error creating test component:', error.message);
}

// 3. Add custom index.html for local testing
const localIndexPath = path.join(__dirname, 'local-index.html');
const localIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Hooks Test</title>
</head>
<body>
  <div id="root"></div>
  <!-- Use a simple script tag to load the test component -->
  <script type="module">
    // Simplest possible test to verify React is working
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    
    function App() {
      return React.createElement('h1', null, 'Hello World');
    }
    
    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(App)
    );
  </script>
</body>
</html>`;

try {
  fs.writeFileSync(localIndexPath, localIndexContent);
  console.log(`\nCreated test HTML at ${localIndexPath}`);
} catch (error) {
  console.error('Error creating test HTML:', error.message);
}

// 4. Provide troubleshooting instructions
console.log('\n===== Debugging Steps =====');
console.log('1. Check that you have the correct version of React installed (React 18+)');
console.log('2. Make sure there are no duplicate React installations in node_modules');
console.log('3. Verify that your .env file has the correct DATABASE_URL');
console.log('4. Try running a very simple React app to test if hooks work at all');
console.log('5. Check for ESLint errors related to hooks (eslint-plugin-react-hooks)');
console.log('\nSolution for the WebSocket error:');
console.log('- The error is related to HMR (Hot Module Replacement)');
console.log('- Try adding "WDS_SOCKET_HOST=localhost" to your .env file');
console.log('- Or start without HMR: NODE_ENV=production npm run dev');