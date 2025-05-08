const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Run the build process
console.log('Running build script...');

// Ensure the build directory exists
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

try {
  // Run React build
  console.log('Building React application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 