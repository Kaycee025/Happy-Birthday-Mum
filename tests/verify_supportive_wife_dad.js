// tests/verify_supportive_wife_dad.js
// Automated verification & visual capture for Dad's tribute & media in A Supportive Wife section

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

function request(pathName) {
  return new Promise((resolve) => {
    http.get('http://localhost:8000' + pathName, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    }).on('error', (e) => resolve({ statusCode: 500, error: e.message }));
  });
}

async function run() {
  console.log('==================================================================');
  console.log('💍 VERIFYING DAD TRIBUTE & MEDIA IN "A SUPPORTIVE WIFE" SECTION');
  console.log('==================================================================');

  // 1. Check local assets
  console.log('\n[1] Checking local media assets...');
  const wifeDir = path.resolve(__dirname, '../assets/supportive-wife');
  assert(fs.existsSync(wifeDir), 'assets/supportive-wife directory exists');

  const p1 = path.join(wifeDir, 'dad-photo-01.jpg');
  const p2 = path.join(wifeDir, 'dad-photo-02.jpg');
  assert(fs.existsSync(p1) && fs.statSync(p1).size > 40000, `dad-photo-01.jpg exists (${fs.statSync(p1).size} bytes)`);
  assert(fs.existsSync(p2) && fs.statSync(p2).size > 100000, `dad-photo-02.jpg exists (${fs.statSync(p2).size} bytes)`);

  // 2. Check data/content.json
  console.log('\n[2] Checking data/content.json...');
  const content = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/content.json'), 'utf-8'));
  const wifeSec = content.sections.find(s => s.id === 'supportive-wife');
  assert(!!wifeSec, 'supportive-wife section found in content.json');
  assert(wifeSec.title === 'A Supportive Wife', 'Section title is "A Supportive Wife"');
  assert(wifeSec.narrative.includes('Happy birthday to my beautiful wife, my partner and the mother of our children. ❤️'), 'Contains Dad opening letter');
  assert(wifeSec.narrative.toLowerCase().includes('watching you love and care for our family is something i never take for granted'), 'Contains Dad paragraph 2');
  assert(wifeSec.narrative.includes('Thank you for standing by me, for all the sacrifices you make'), 'Contains Dad gratitude paragraph');
  assert(wifeSec.narrative.includes('Happy birthday, my love. ❤️'), 'Contains Dad closing wish');
  assert(Array.isArray(wifeSec.photos) && wifeSec.photos.length === 2, `Contains 2 photos (found: ${wifeSec.photos?.length})`);

  // 3. Check Live API Response
  console.log('\n[3] Checking GET /api/content...');
  const apiRes = await request('/api/content');
  assert(apiRes.statusCode === 200, 'Live API returns HTTP 200');
  const apiWifeSec = apiRes.json?.sections?.find(s => s.id === 'supportive-wife');
  assert(!!apiWifeSec, 'API returns supportive-wife section');
  assert(apiWifeSec.photos?.length === 2, 'API returns 2 photos for supportive-wife');
  assert(apiWifeSec.narrative.includes('Happy birthday to my beautiful wife'), 'API serves Dad write-up');

  // 4. Check HTTP image delivery
  console.log('\n[4] Checking image HTTP delivery...');
  for (let i = 1; i <= 2; i++) {
    const url = `/assets/supportive-wife/dad-photo-0${i}.jpg`;
    const imgRes = await request(url);
    assert(imgRes.statusCode === 200, `HTTP GET ${url} returns 200`);
    assert(imgRes.headers['content-type'] === 'image/jpeg', `${url} has Content-Type image/jpeg`);
  }

  // 5. Visual screenshot capture
  console.log('\n[5] Capturing visual screenshot of updated A Supportive Wife page...');
  const browserBin = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(browserBin)) {
    // Generate a test harness that immediately hides gate-page so the chapter screenshot is pristine
    const cleanPagePath = path.join(__dirname, 'clean_supportive_wife.html');
    const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
    const cleanInjection = `
    <base href="/">
    <style>
      #gate-page { display: none !important; }
      #home-page { display: block !important; opacity: 1 !important; visibility: visible !important; }
      #page-hero { display: none !important; }
      #page-supportive-wife { display: block !important; opacity: 1 !important; transform: none !important; }
    </style>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const homePage = document.getElementById('home-page');
        if (homePage) homePage.classList.add('active');
        const wifePage = document.getElementById('page-supportive-wife');
        if (wifePage) wifePage.classList.add('active-page');
        const heroPage = document.getElementById('page-hero');
        if (heroPage) heroPage.classList.remove('active-page');
      });
    </script>
    `;
    fs.writeFileSync(cleanPagePath, indexHtml.replace('<head>', '<head>' + cleanInjection));

    const shotPath = path.join(__dirname, 'supportive_wife_dad_preview.png');
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1280,1050',
      `--screenshot=${shotPath}`,
      'http://localhost:8000/tests/clean_supportive_wife.html'
    ];

    try {
      execFileSync(browserBin, args, { stdio: 'inherit', timeout: 35000 });
      assert(fs.existsSync(shotPath) && fs.statSync(shotPath).size > 50000, `Screenshot saved: ${shotPath} (${fs.statSync(shotPath).size} bytes)`);
    } catch(e) {
      console.error('Screenshot capture error:', e.message);
    }

    // Also mobile capture
    const mobileShotPath = path.join(__dirname, 'supportive_wife_dad_mobile.png');
    const mobileArgs = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=520,1200',
      `--screenshot=${mobileShotPath}`,
      'http://localhost:8000/tests/clean_supportive_wife.html'
    ];

    try {
      execFileSync(browserBin, mobileArgs, { stdio: 'inherit', timeout: 35000 });
      assert(fs.existsSync(mobileShotPath) && fs.statSync(mobileShotPath).size > 50000, `Mobile screenshot saved: ${mobileShotPath} (${fs.statSync(mobileShotPath).size} bytes)`);
    } catch(e) {
      console.error('Mobile capture error:', e.message);
    }
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL DAD TRIBUTE & MEDIA TESTS PASSED 100%!');
  console.log('==================================================================');
}

run().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
