const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\pc\\OneDrive\\Pictures\\Second daughter';
const destDir = path.join(__dirname, '..', 'assets', 'second-daughter');

console.log('Source directory:', srcDir);
console.log('Target directory:', destDir);

if (!fs.existsSync(srcDir)) {
  console.error('Source directory does not exist!');
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
console.log('Found files in source:', files);

let photoIdx = 1;
let videoIdx = 1;
const copiedPhotos = [];
const copiedVideos = [];

files.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  const srcPath = path.join(srcDir, file);
  const stats = fs.statSync(srcPath);
  if (!stats.isFile()) return;

  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    const pad = String(photoIdx++).padStart(2, '0');
    const destName = `daughter2-photo-${pad}${ext === '.jpeg' ? '.jpg' : ext}`;
    const destPath = path.join(destDir, destName);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied photo: ${file} -> ${destName} (${stats.size} bytes)`);
    copiedPhotos.push(`assets/second-daughter/${destName}`);
  } else if (['.mp4', '.mov', '.webm'].includes(ext)) {
    const pad = String(videoIdx++).padStart(2, '0');
    const destName = `daughter2-video-${pad}.mp4`;
    const destPath = path.join(destDir, destName);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied video: ${file} -> ${destName} (${stats.size} bytes)`);
    copiedVideos.push(`assets/second-daughter/${destName}`);
  }
});

console.log('\n--- Summary ---');
console.log(`Total photos copied: ${copiedPhotos.length}`);
console.log(`Total videos copied: ${copiedVideos.length}`);
console.log('Photos:', JSON.stringify(copiedPhotos, null, 2));
console.log('Videos:', JSON.stringify(copiedVideos, null, 2));
