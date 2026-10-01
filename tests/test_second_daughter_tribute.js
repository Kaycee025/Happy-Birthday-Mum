const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('==================================================================');
console.log('👧 VERIFYING SECOND DAUGHTER TRIBUTE & 3-CHILD ALTERNATING FLOW');
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
const daughter2Dir = path.join(rootDir, 'assets', 'second-daughter');

// 1. Files in assets/second-daughter
assert(fs.existsSync(daughter2Dir), 'assets/second-daughter directory exists');
const photos = fs.readdirSync(daughter2Dir).filter(f => f.endsWith('.jpg'));
assert(photos.length >= 1, `Second daughter photo present (found: ${photos.length})`);

// 2. content.json assertions
const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
assert(content.childrenTributes.length >= 3, `childrenTributes contains at least 3 children (found: ${content.childrenTributes.length})`);

const child3 = content.childrenTributes.find(c => c.childIndex === 3);
assert(child3, 'Child 3 exists in childrenTributes');
assert(child3.role === 'Second Daughter', 'Child 3 role is Second Daughter');
assert(child3.narrative.includes('One striking character'), 'Child 3 narrative has "One striking character"');
assert(child3.narrative.includes('support you 100 %'), 'Child 3 narrative has "support you 100 %"');
assert(child3.narrative.includes('Happy birthday Mummy'), 'Child 3 narrative has "Happy birthday Mummy"');
assert(child3.narrative.includes('beauty of the Lord.💙'), 'Child 3 narrative has heart and blessings');
assert(child3.photos.length >= 1, 'Child 3 has at least 1 photo');

// 3. Alternating layout logic in app.js
const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
assert(appJs.includes('child.childIndex % 2 === 0'), 'Alternating row logic is index-based (even = reverse, odd = normal)');

// 4. Admin upload support in server.js & admin.html
const serverJs = fs.readFileSync(path.join(rootDir, 'server.js'), 'utf8');
assert(serverJs.includes("section.startsWith('child-')"), 'server.js supports direct photo uploads to child tributes');

const adminHtml = fs.readFileSync(path.join(rootDir, 'admin.html'), 'utf8');
assert(adminHtml.includes('child-3-second-daughter'), 'admin.html contains direct photo upload target for Second Daughter');

// 5. Test Live Server Endpoints
http.get('http://localhost:8000/api/content', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    assert(json.childrenTributes.length >= 3, 'API returns at least 3 children tributes');
    const apiChild3 = json.childrenTributes.find(c => c.childIndex === 3);
    assert(apiChild3 && apiChild3.role === 'Second Daughter', 'API Child 3 is Second Daughter');
    assert(apiChild3 && apiChild3.photos.length >= 1, 'API Child 3 has photo URL');

    // Test image HTTP 200
    http.get('http://localhost:8000/' + apiChild3.photos[0], imgRes => {
      assert(imgRes.statusCode === 200, `Second daughter photo returns HTTP 200 (got: ${imgRes.statusCode})`);
      assert(imgRes.headers['content-type'] === 'image/jpeg', 'Photo content-type is image/jpeg');

      console.log('\n==================================================================');
      console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log('==================================================================');
      process.exit(failed > 0 ? 1 : 0);
    });
  });
}).on('error', err => {
  console.error('API request error:', err);
  process.exit(1);
});
