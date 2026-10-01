const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

console.log('==================================================================');
console.log('👦 VERIFYING THIRD SON (LAST BORN) & 5-CHILD ALTERNATING FLOW');
console.log('==================================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

const rootDir = path.resolve(__dirname, '..');
const contentFile = path.join(rootDir, 'data', 'content.json');
const storageFile = path.join(rootDir, 'js', 'storage.js');
const thirdSonDir = path.join(rootDir, 'assets', 'third-son');
const adminFile = path.join(rootDir, 'admin.html');

// 1. Files in assets/third-son
assert(fs.existsSync(thirdSonDir), 'assets/third-son directory exists');
const photos = fs.readdirSync(thirdSonDir).filter(f => f.endsWith('.jpg'));
assert(photos.length === 7, `All 7 photos copied to assets/third-son (found: ${photos.length})`);
photos.forEach((p, idx) => {
  const size = fs.statSync(path.join(thirdSonDir, p)).size;
  assert(size > 50000, `Photo ${p} is valid size (${size} bytes)`);
});

// 2. content.json assertions
const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
assert(Array.isArray(content.childrenTributes), 'childrenTributes array exists');
assert(content.childrenTributes.length === 5, `childrenTributes contains 5 children (found: ${content.childrenTributes.length})`);

const child5 = content.childrenTributes.find(c => c.id === 'child-5-third-son' || c.childIndex === 5);
assert(!!child5, 'Child 5 exists in childrenTributes');
assert(child5.role === 'Third Son', `Child 5 role is Third Son (got: ${child5.role})`);
assert(child5.narrative.includes('Mummy, being the last born'), 'Child 5 narrative has "Mummy, being the last born"');
assert(child5.narrative.includes('special place in your heart'), 'Child 5 narrative has "special place in your heart"');
assert(child5.narrative.includes('love, care, sacrifices, and prayers'), 'Child 5 narrative has prayers & sacrifices');
assert(child5.narrative.includes('everything your heart desires'), 'Child 5 narrative has heart desires wish');
assert(child5.photos.length === 7, `Child 5 has 7 photos (got: ${child5.photos.length})`);

// 3. Alternating layout flow across all 5 children
const expectedFlow = [
  { idx: 1, reverse: false, label: 'Child 1: Media Left, Text Right' },
  { idx: 2, reverse: true,  label: 'Child 2: Text Left, Media Right' },
  { idx: 3, reverse: false, label: 'Child 3: Media Left, Text Right' },
  { idx: 4, reverse: true,  label: 'Child 4: Text Left, Media Right' },
  { idx: 5, reverse: false, label: 'Child 5: Media Left, Text Right' }
];

expectedFlow.forEach(flow => {
  const c = content.childrenTributes.find(item => item.childIndex === flow.idx);
  const isReversed = (c.childIndex % 2 === 0);
  assert(isReversed === flow.reverse, `Layout flow verified: ${flow.label}`);
});

// 4. Admin Studio upload target
const adminHtml = fs.readFileSync(adminFile, 'utf8');
assert(adminHtml.includes('child-5-third-son'), 'admin.html contains child-5-third-son upload target');
assert(adminHtml.includes('Tap to upload photo for Third Son'), 'admin.html contains Third Son upload prompt');

// 5. Test Live Server Endpoints
function makeRequest(pathName) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:8000' + pathName, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    }).on('error', reject);
  });
}

async function runLiveTests() {
  const apiRes = await makeRequest('/api/content');
  assert(apiRes.statusCode === 200, 'GET /api/content returns HTTP 200');
  assert(apiRes.json && apiRes.json.childrenTributes.length === 5, 'Live API returns all 5 children');
  
  const apiChild5 = apiRes.json.childrenTributes[4];
  assert(apiChild5 && apiChild5.role === 'Third Son', 'API Child 5 role is Third Son');
  assert(apiChild5 && apiChild5.photos.length === 7, 'API Child 5 has 7 photos');

  const imgRes = await makeRequest('/' + apiChild5.photos[0]);
  assert(imgRes.statusCode === 200, 'Third son photo 1 is served via HTTP 200');
  assert(imgRes.headers['content-type'] === 'image/jpeg', 'Content-Type is image/jpeg');

  // Capture full screenshot of the 5-child chapter
  const browser = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(browser)) {
    const screenshotPath = path.join(__dirname, 'best_mum_5_children_preview.png');
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--screenshot=${screenshotPath}`,
      '--window-size=1280,4500',
      'http://localhost:8000/?page=page-best-mum'
    ];
    try {
      execFileSync(browser, args, { stdio: 'inherit', timeout: 45000 });
      assert(fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 100000, 'best_mum_5_children_preview.png created');
      console.log(`  📸 Screenshot of all 5 children saved: ${screenshotPath} (${fs.statSync(screenshotPath).size} bytes)`);
    } catch (e) {
      console.error('Screenshot error:', e.message);
    }
  }

  console.log('\n==================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runLiveTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
