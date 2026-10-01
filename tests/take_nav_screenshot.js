const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (!fs.existsSync(browser)) {
  console.error('Browser not found');
  process.exit(1);
}

const desktopScreenshot = path.join(__dirname, 'desktop_nav_verified.png');
const mobileScreenshot = path.join(__dirname, 'mobile_nav_verified.png');

// Desktop view
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--screenshot=${desktopScreenshot}`,
  '--window-size=1280,720',
  'http://localhost:8000/?page=page-hero'
], { stdio: 'inherit', timeout: 30000 });

console.log('Desktop screenshot created:', fs.statSync(desktopScreenshot).size, 'bytes');

// Mobile view
execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--screenshot=${mobileScreenshot}`,
  '--window-size=412,850',
  'http://localhost:8000/?page=page-hero'
], { stdio: 'inherit', timeout: 30000 });

console.log('Mobile screenshot created:', fs.statSync(mobileScreenshot).size, 'bytes');
