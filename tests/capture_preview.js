const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const browser = candidates.find(p => fs.existsSync(p));

if (browser) {
  const heroPath = path.join(__dirname, 'hero_mum_preview.png');
  const args1 = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--screenshot=${heroPath}`,
    '--window-size=1280,1200',
    'http://localhost:8000/?page=page-hero'
  ];
  try {
    execFileSync(browser, args1, { stdio: 'inherit', timeout: 30000 });
    console.log('Hero screenshot created:', heroPath, fs.statSync(heroPath).size);
  } catch(e) {
    console.error('Hero err:', e.message);
  }

  const bestMumPath = path.join(__dirname, 'best_mum_preview.png');
  const args2 = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--screenshot=${bestMumPath}`,
    '--window-size=1280,3400',
    'http://localhost:8000/?page=page-best-mum'
  ];
  try {
    execFileSync(browser, args2, { stdio: 'inherit', timeout: 30000 });
    console.log('Best mum screenshot created:', bestMumPath, fs.statSync(bestMumPath).size);
  } catch(e) {
    console.error('Best mum err:', e.message);
  }
}
