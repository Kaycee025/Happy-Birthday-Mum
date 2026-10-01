const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('==================================================================');
console.log('💖 VERIFYING MUM NAME ("Mum") & ELIMINATION OF "Tribute" WORDING');
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
const indexFile = path.join(rootDir, 'index.html');
const adminFile = path.join(rootDir, 'admin.html');
const appJsFile = path.join(rootDir, 'js', 'app.js');

// 1. content.json assertions
const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
assert(content.settings.mumName === 'Mum', `content.json mumName is "Mum" (got: "${content.settings.mumName}")`);
assert(!JSON.stringify(content).toLowerCase().includes('"evelyn"'), 'No occurrence of "Evelyn" in content.json values');
assert(content.hero.badge === 'Keepsake Appreciation • December 23', `hero.badge is "Keepsake Appreciation" (got: "${content.hero.badge}")`);
const tributeVideoCount = (content.videos || []).filter(v => (v.description || '').toLowerCase().includes('tribute')).length;
assert(tributeVideoCount === 0, `0 video descriptions contain "tribute" (found: ${tributeVideoCount})`);

// 2. storage.js assertions
const storageContent = fs.readFileSync(storageFile, 'utf8');
assert(storageContent.includes('mumName: "Mum"'), 'storage.js default mumName is "Mum"');
assert(!storageContent.includes('mumName: "Evelyn"'), 'storage.js does not contain Evelyn');
assert(storageContent.includes('badge: "Keepsake Appreciation'), 'storage.js hero badge is Keepsake Appreciation');

// 3. index.html assertions
const indexHtml = fs.readFileSync(indexFile, 'utf8');
assert(!indexHtml.includes('Keepsake Tribute'), 'index.html does not contain "Keepsake Tribute"');
assert(indexHtml.includes('Keepsake Appreciation'), 'index.html contains "Keepsake Appreciation"');
assert(!indexHtml.includes('A tribute to the woman'), 'index.html does not contain "A tribute to the woman"');
assert(indexHtml.includes('A celebration of the woman'), 'index.html contains "A celebration of the woman"');

// 4. app.js assertions
const appJs = fs.readFileSync(appJsFile, 'utf8');
assert(!appJs.includes('Tributes of Devotion'), 'app.js does not contain "Tributes of Devotion"');
assert(appJs.includes('Words of Love & Praise'), 'app.js uses "Words of Love & Praise"');

// 5. admin.html assertions
const adminHtml = fs.readFileSync(adminFile, 'utf8');
assert(!adminHtml.includes('birthday tribute website'), 'admin.html header does not say tribute website');
assert(adminHtml.includes("Mum's birthday appreciation website"), 'admin.html header uses appreciation');
assert(!adminHtml.includes("Children's Tributes Photos"), 'admin.html does not contain "Children\'s Tributes Photos"');
assert(adminHtml.includes("Children's Appreciation Photos"), 'admin.html uses "Children\'s Appreciation Photos"');

// 6. Live Server HTTP API Check
http.get('http://localhost:8000/api/content', res => {
  assert(res.statusCode === 200, 'GET /api/content returns HTTP 200');
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const liveJson = JSON.parse(data);
    assert(liveJson.settings.mumName === 'Mum', `Live API settings.mumName is "Mum" (got: "${liveJson.settings.mumName}")`);
    assert(liveJson.hero.badge === 'Keepsake Appreciation • December 23', `Live API hero.badge is Keepsake Appreciation (got: "${liveJson.hero.badge}")`);

    console.log('\n==================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================================');
    process.exit(failed > 0 ? 1 : 0);
  });
}).on('error', err => {
  console.error('Server request error:', err);
  process.exit(1);
});
