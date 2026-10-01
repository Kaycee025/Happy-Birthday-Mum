const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const screenshotPath = path.join(__dirname, 'mobile_nav_drawer_open.png');

// Create a small wrapper or click trigger
const script = `
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const btn = document.getElementById('nav-toggle-btn');
        if (btn) btn.click();
      }, 400);
    });
  </script>
`;

const indexHtml = fs.readFileSync('index.html', 'utf-8');
fs.writeFileSync('tests/open_drawer_test.html', indexHtml.replace('</body>', `${script}</body>`));

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--window-size=520,950',
  `--screenshot=${screenshotPath}`,
  'file:///' + path.resolve('tests/open_drawer_test.html').replace(/\\/g, '/')
];

execFileSync(edgePath, args, { stdio: 'inherit' });
console.log('Saved mobile_nav_drawer_open.png, size:', fs.statSync(screenshotPath).size);
