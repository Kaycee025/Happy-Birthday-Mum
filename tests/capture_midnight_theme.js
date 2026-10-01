const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const browser = candidates.find(p => fs.existsSync(p));
if (!browser) {
  console.error('No browser found!');
  process.exit(1);
}

const targets = [
  { name: 'envelope_gate_midnight.png', url: 'http://localhost:8000', size: '1280,900' },
  { name: 'hero_midnight.png', url: 'http://localhost:8000/?page=page-hero', size: '1280,1100' },
  { name: 'best_mum_midnight.png', url: 'http://localhost:8000/?page=page-best-mum', size: '1280,1400' },
  { name: 'wishes_midnight.png', url: 'http://localhost:8000/?page=page-wishes', size: '1280,1200' },
  { name: 'mobile_hero_midnight.png', url: 'http://localhost:8000/?page=page-hero', size: '390,844' },
  { name: 'admin_login_midnight.png', url: 'http://localhost:8000/admin/login', size: '1280,900' }
];

targets.forEach(t => {
  const outPath = path.join(__dirname, t.name);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--screenshot=${outPath}`,
    `--window-size=${t.size}`,
    t.url
  ];
  try {
    execFileSync(browser, args, { stdio: 'ignore', timeout: 30000 });
    const stat = fs.statSync(outPath);
    console.log(`Captured ${t.name} (${stat.size} bytes)`);
  } catch (err) {
    console.error(`Error capturing ${t.name}:`, err.message);
  }
});
