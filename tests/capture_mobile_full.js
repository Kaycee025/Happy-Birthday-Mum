const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const screenshotPath = path.join(__dirname, 'mobile_nav_full_width.png');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--window-size=520,950',
  `--screenshot=${screenshotPath}`,
  'http://localhost:8000/?page=page-hero'
];

execFileSync(edgePath, args, { stdio: 'inherit' });
console.log('Saved mobile_nav_full_width.png, size:', fs.statSync(screenshotPath).size);
