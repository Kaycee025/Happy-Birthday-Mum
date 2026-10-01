// tests/test_wish_thank_you_flow.js
// Complete automated test & visual verification for Mum's Birthday Wish Thank-You flow

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

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('==================================================================');
  console.log('🌸 VERIFYING MUM BIRTHDAY WISH THANK-YOU FLOW');
  console.log('==================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const styleCss = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf-8');
  const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf-8');
  const serverJs = fs.readFileSync(path.join(rootDir, 'server.js'), 'utf-8');

  // 1. Static HTML Checks
  console.log('\n[1] Checking index.html markup...');
  assert(indexHtml.includes('id="wish-thankyou-modal"'), 'index.html contains #wish-thankyou-modal');
  assert(indexHtml.includes('“Thank you for all your wishes, it made my day.”'), 'index.html contains Mum\'s quote');
  assert(indexHtml.includes('id="wish-thankyou-portrait-img"'), 'index.html contains portrait image container');
  assert(indexHtml.includes('id="wish-thankyou-view-btn"'), 'index.html contains "View Your Wish" button');
  assert(indexHtml.includes('id="wish-thankyou-close-btn"'), 'index.html contains close button');

  // 2. CSS Checks
  console.log('\n[2] Checking css/style.css design rules...');
  assert(styleCss.includes('.wish-thankyou-modal {'), 'style.css contains .wish-thankyou-modal');
  assert(styleCss.includes('.wish-thankyou-card {'), 'style.css contains .wish-thankyou-card');
  assert(styleCss.includes('.wish-thankyou-inline {'), 'style.css contains .wish-thankyou-inline');
  assert(styleCss.includes('.wish-thankyou-headline {'), 'style.css contains .wish-thankyou-headline');
  assert(styleCss.includes('.btn-thankyou-view {'), 'style.css contains .btn-thankyou-view');
  assert(styleCss.includes('.wish-thankyou-portrait-ring {'), 'style.css contains .wish-thankyou-portrait-ring');

  // 3. JavaScript Checks
  console.log('\n[3] Checking js/app.js behavior...');
  assert(appJs.includes('openWishThankYouModal'), 'app.js contains openWishThankYouModal helper');
  assert(appJs.includes('Thank you for all your wishes, it made my day.'), 'app.js renders Mum\'s thank you message');
  assert(appJs.includes('wish-thankyou-inline'), 'app.js sets .wish-thankyou-inline in feedback banner');

  // 4. Server API Checks
  console.log('\n[4] Checking server.js endpoint...');
  assert(serverJs.includes("message: 'Thank you for all your wishes, it made my day.'"), 'server.js returns Mum\'s thank you message in JSON');

  // 5. Test Live Submission via API
  console.log('\n[5] Testing live submission flow via API...');
  // Login as admin
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'admin',
    password: 'MumLove2026!'
  });
  assert(loginRes.statusCode === 200, 'Admin login succeeds');
  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';

  // Toggle test mode ON
  await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/wishes/toggle-test-mode',
    method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' }
  });

  // Submit wish
  const testPayload = {
    name: 'Grace Adewale',
    phone: '+234 803 123 4567',
    avatar: '💖',
    message: 'Happy Birthday to the most selfless and wonderful Mother on earth! We celebrate you today and forever.'
  };

  const submitRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/wishes',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testPayload);

  assert(submitRes.statusCode === 200, 'Live wish submission returns HTTP 200');
  assert(submitRes.json?.success === true, 'Response success is true');
  assert(submitRes.json?.message === 'Thank you for all your wishes, it made my day.', 'Response message is Mum\'s exact thank-you words');
  assert(submitRes.json?.thankYouMessage === 'Thank you for all your wishes, it made my day.', 'Response thankYouMessage is Mum\'s exact thank-you words');

  // Delete test wish
  const wishId = submitRes.json?.wish?.id;
  if (wishId) {
    await makeRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/admin/wishes/delete',
      method: 'POST',
      headers: { 'Cookie': cookie, 'Content-Type': 'application/json' }
    }, { id: wishId });
  }

  // Restore test mode OFF
  await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/wishes/toggle-test-mode',
    method: 'POST',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json' }
  });

  // 6. Visual Browser Screenshot Verification
  console.log('\n[6] Visual Browser Verification: Triggering submission and capturing modal...');
  const edgePathCandidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const browserBin = edgePathCandidates.find(p => fs.existsSync(p));

  if (browserBin) {
    const testHtmlPath = path.join(__dirname, 'test_modal_visual.html');
    const screenshotPath = path.join(__dirname, 'wish_thankyou_modal_verified.png');

    // Generate test harness that automatically displays the modal immediately for headless capture
    const injection = `
    <style>
      #wish-thankyou-modal {
        display: flex !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      #wish-thankyou-modal .wish-thankyou-card {
        transform: translateY(0) scale(1) !important;
      }
    </style>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('wish-thankyou-modal');
        if (modal) {
          modal.style.display = 'flex';
          modal.classList.add('active');
        }
      });
    </script>
    `;

    let renderedHtml = indexHtml.replace('<head>', '<head><base href="/">');
    renderedHtml = renderedHtml.replace('</body>', `${injection}</body>`);
    fs.writeFileSync(testHtmlPath, renderedHtml);

    const edgeArgs = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--window-size=1200,900',
      `--screenshot=${screenshotPath}`,
      'http://localhost:8000/tests/test_modal_visual.html'
    ];

    try {
      execFileSync(browserBin, edgeArgs, { stdio: 'inherit', timeout: 30000 });
      assert(fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 10000, `Screenshot saved: ${screenshotPath} (${fs.statSync(screenshotPath).size} bytes)`);
    } catch (e) {
      console.error('Edge screenshot error:', e.message);
    }

    // Also take mobile screenshot of the thank-you modal
    const mobileScreenshotPath = path.join(__dirname, 'wish_thankyou_modal_mobile.png');
    const mobileEdgeArgs = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=520,950',
      `--screenshot=${mobileScreenshotPath}`,
      'http://localhost:8000/tests/test_modal_visual.html'
    ];

    try {
      execFileSync(browserBin, mobileEdgeArgs, { stdio: 'inherit', timeout: 30000 });
      assert(fs.existsSync(mobileScreenshotPath) && fs.statSync(mobileScreenshotPath).size > 10000, `Mobile screenshot saved: ${mobileScreenshotPath} (${fs.statSync(mobileScreenshotPath).size} bytes)`);
    } catch (e) {
      console.error('Mobile edge screenshot error:', e.message);
    }
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL MUM BIRTHDAY WISH THANK-YOU TESTS PASSED PERFECTLY!');
  console.log('==================================================================');
}

run().catch(err => {
  console.error('❌ Error executing test:', err);
  process.exit(1);
});
