const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/@coderline/alphatab/dist');
const publicDir = path.join(__dirname, '../public');

// Create directories if they don't exist
const fontDir = path.join(publicDir, 'font');
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

// Copy font files
const fontFiles = ['Bravura.woff2', 'Bravura.woff', 'Bravura.otf'];
fontFiles.forEach(file => {
  const source = path.join(sourceDir, 'font', file);
  const dest = path.join(fontDir, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`Copied ${file} to public/font/`);
  }
});

// Copy worker files
const workerFiles = ['alphaTab.worker.mjs', 'alphaTab.worker.min.mjs'];
workerFiles.forEach(file => {
  const source = path.join(sourceDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`Copied ${file} to public/`);
  }
});

console.log('AlphaTab assets copied successfully!');