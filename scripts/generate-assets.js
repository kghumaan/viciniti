const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG in base64
const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

const assets = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash.png', size: 2048 },
  { name: 'favicon.png', size: 48 }
];

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Generate each asset
assets.forEach(({ name, size }) => {
  const buffer = Buffer.from(transparentPixel, 'base64');
  fs.writeFileSync(path.join(assetsDir, name), buffer);
  console.log(`Generated ${name}`);
}); 