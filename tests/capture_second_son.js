const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const screenshotPath = path.join(__dirname, 'second_son_updated_preview.png');

// We can create a test page or load directly and scroll to Second Son
const testPagePath = path.join(__dirname, 'second_son_view.html');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');

const script = `
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const target = document.getElementById('tribute-child-4-second-son');
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, 800);
  });
</script>
`;

fs.writeFileSync(testPagePath, indexHtml.replace('<head>', '<head><base href="/">' + script));

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1280,4500',
  `--screenshot=${screenshotPath}`,
  'http://localhost:8000/tests/second_son_view.html?page=page-best-mum'
];

try {
  execFileSync(browser, args, { stdio: 'inherit', timeout: 30000 });
  console.log('Saved second_son_updated_preview.png, size:', fs.statSync(screenshotPath).size);
} catch(e) {
  console.error('Error:', e.message);
}
