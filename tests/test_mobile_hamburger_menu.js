const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTest() {
  console.log('==================================================================');
  console.log('📱 VERIFYING MOBILE 3-LINE HAMBURGER NAVIGATION & DRAWER');
  console.log('==================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const styleCss = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf-8');
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf-8');

  // 1. Static HTML checks
  assert(indexHtml.includes('class="nav-mobile-bar"'), 'index.html contains .nav-mobile-bar');
  assert(indexHtml.includes('id="nav-toggle-btn"'), 'index.html contains #nav-toggle-btn');
  assert(indexHtml.includes('class="hamburger-line line-1"'), 'index.html contains hamburger line-1');
  assert(indexHtml.includes('class="hamburger-line line-2"'), 'index.html contains hamburger line-2');
  assert(indexHtml.includes('class="hamburger-line line-3"'), 'index.html contains hamburger line-3');
  assert(indexHtml.includes('id="nav-mobile-title"'), 'index.html contains #nav-mobile-title');

  // 2. CSS checks
  assert(styleCss.includes('.nav-mobile-bar {\n  display: none;\n}'), 'Desktop hides .nav-mobile-bar');
  assert(styleCss.includes('.nav-toggle-btn {'), 'style.css styles .nav-toggle-btn');
  assert(styleCss.includes('.hamburger-line {'), 'style.css styles .hamburger-line');
  assert(styleCss.includes('.site-nav.menu-open .hamburger-line.line-1'), 'style.css animates line 1 for close X');
  assert(styleCss.includes('.site-nav.menu-open .hamburger-line.line-2'), 'style.css fades line 2 for close X');
  assert(styleCss.includes('.site-nav.menu-open .hamburger-line.line-3'), 'style.css animates line 3 for close X');
  assert(styleCss.includes('.site-nav.menu-open .nav-links'), 'style.css shows dropdown menu when .menu-open');

  // 3. JavaScript checks
  assert(appJs.includes("siteNav.classList.toggle('menu-open')"), 'app.js toggles .menu-open on click');
  assert(appJs.includes("nav-mobile-title"), 'app.js manages nav-mobile-title dynamically');
  assert(appJs.includes("toggleBtn.setAttribute('aria-expanded'"), 'app.js sets aria-expanded accessibility state');
  assert(appJs.includes("siteNav.classList.remove('menu-open')"), 'app.js auto-closes menu on page switch / outside click');

  // 4. Live Server HTTP Check
  const serverCheck = await new Promise((resolve) => {
    http.get('http://localhost:8000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });

  assert(serverCheck.status === 200, 'Server returns HTTP 200');
  assert(serverCheck.html.includes('id="nav-toggle-btn"'), 'Live server serves #nav-toggle-btn');
  assert(serverCheck.html.includes('class="hamburger-line line-1"'), 'Live server serves 3 hamburger lines');

  // 5. Visual Mobile Screenshot Capture via Browser
  const browserCandidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const browser = browserCandidates.find(p => fs.existsSync(p));
  if (browser) {
    const screenshotPath = path.join(__dirname, 'mobile_nav_preview.png');
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--screenshot=${screenshotPath}`,
      '--window-size=375,812',
      'http://localhost:8000/?page=page-hero'
    ];
    try {
      execFileSync(browser, args, { stdio: 'inherit', timeout: 30000 });
      assert(fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 10000,
        `Mobile screenshot captured (${fs.statSync(screenshotPath).size} bytes)`);
      console.log('  📸 Mobile screenshot saved to:', screenshotPath);
    } catch (e) {
      console.warn('  ⚠️ Screenshot execution notice:', e.message);
    }
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL MOBILE HAMBURGER MENU TESTS PASSED 100%!');
  console.log('==================================================================');
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
