const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// We can dump DOM metrics using Edge console/eval or check elements
const screenshotPath = path.join(__dirname, 'mobile_viewport_375.png');
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=390,844',
  `--screenshot=${screenshotPath}`,
  'http://localhost:8000/?page=page-hero'
];

execFileSync(edgePath, args, { stdio: 'inherit' });
console.log('Saved to', screenshotPath);
