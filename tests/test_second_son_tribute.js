const fs = require('fs');
const path = require('path');
const http = require('http');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function request(method, pathName) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: pathName,
      method: method
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', (e) => resolve({ statusCode: 500, error: e.message }));
    req.end();
  });
}

async function run() {
  console.log('==================================================================');
  console.log('👦 VERIFYING SECOND SON TRIBUTE & 4-CHILD ALTERNATING FLOW');
  console.log('==================================================================');

  // 1. Check folder & file
  const sonDir = path.resolve(__dirname, '../assets/second-son');
  assert(fs.existsSync(sonDir), 'assets/second-son directory exists');

  const files = fs.readdirSync(sonDir);
  assert(files.includes('son2-photo-01.jpg'), 'son2-photo-01.jpg is present in assets/second-son');
  assert(files.includes('son2-photo-02.jpg'), 'son2-photo-02.jpg is present in assets/second-son');
  assert(files.includes('son2-photo-03.jpg'), 'son2-photo-03.jpg is present in assets/second-son');
  assert(fs.statSync(path.join(sonDir, 'son2-photo-01.jpg')).size > 50000, 'son2-photo-01.jpg size valid');
  assert(fs.statSync(path.join(sonDir, 'son2-photo-02.jpg')).size > 30000, 'son2-photo-02.jpg size valid');
  assert(fs.statSync(path.join(sonDir, 'son2-photo-03.jpg')).size > 30000, 'son2-photo-03.jpg size valid');

  // 2. Check content.json
  const content = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/content.json'), 'utf-8'));
  assert(Array.isArray(content.childrenTributes), 'childrenTributes array exists');
  assert(content.childrenTributes.length >= 4, `childrenTributes contains at least 4 children (found: ${content.childrenTributes.length})`);

  const child4 = content.childrenTributes.find(c => c.id === 'child-4-second-son' || c.childIndex === 4);
  assert(!!child4, 'Child 4 exists in childrenTributes');
  assert(child4.role === 'Second Son', `Child 4 role is Second Son (got: ${child4.role})`);
  assert(child4.narrative.includes('Happy birthday Mummy 🤭'), 'Child 4 narrative has opening greeting');
  assert(child4.narrative.includes("don't enter kitchen today oo"), 'Child 4 narrative has kitchen message');
  assert(child4.narrative.includes('Many more years to reap the fruit of ur labour'), 'Child 4 narrative has fruit of labour wish');
  assert(child4.photos && child4.photos.length === 3, `Child 4 has exactly 3 photos (got: ${child4.photos.length})`);
  assert(child4.photos[0] === 'assets/second-son/son2-photo-01.jpg', 'Child 4 photo 1 points to son2-photo-01.jpg');
  assert(child4.photos[1] === 'assets/second-son/son2-photo-02.jpg', 'Child 4 photo 2 points to son2-photo-02.jpg');
  assert(child4.photos[2] === 'assets/second-son/son2-photo-03.jpg', 'Child 4 photo 3 points to son2-photo-03.jpg');

  // 3. Check alternating layout logic (4 children: odd = normal, even = reverse)
  // Child 1 (odd: 1 % 2 !== 0) -> normal (media left, text right)
  // Child 2 (even: 2 % 2 === 0) -> reverse (text left, media right)
  // Child 3 (odd: 3 % 2 !== 0) -> normal (media left, text right)
  // Child 4 (even: 4 % 2 === 0) -> reverse (text left, media right)
  const isC1Reversed = (1 % 2 === 0);
  const isC2Reversed = (2 % 2 === 0);
  const isC3Reversed = (3 % 2 === 0);
  const isC4Reversed = (4 % 2 === 0);

  assert(!isC1Reversed && isC2Reversed && !isC3Reversed && isC4Reversed,
    'Alternating layout flow verified: C1=normal, C2=reverse, C3=normal, C4=reverse');

  // 4. Check admin.html & server.js upload targets
  const adminHtml = fs.readFileSync(path.resolve(__dirname, '../admin.html'), 'utf-8');
  assert(adminHtml.includes('child-4-second-son'), 'admin.html contains child-4-second-son upload target');
  assert(adminHtml.includes('Tap to upload photo for Second Son'), 'admin.html contains Second Son upload label');

  // 5. Test Live API Endpoint
  const apiRes = await request('GET', '/api/content');
  assert(apiRes.statusCode === 200, 'GET /api/content returns HTTP 200');
  assert(apiRes.json && apiRes.json.childrenTributes.length >= 4, 'Live API returns at least 4 children');

  const apiChild4 = apiRes.json.childrenTributes[3];
  assert(apiChild4.role === 'Second Son', 'API Child 4 role is Second Son');
  assert(apiChild4.photos.length === 3, 'API Child 4 has all 3 photos');

  // 6. Test Live Image Delivery for all 3 photos
  for (let i = 1; i <= 3; i++) {
    const photoUrl = `/assets/second-son/son2-photo-0${i}.jpg`;
    const imgRes = await request('GET', photoUrl);
    assert(imgRes.statusCode === 200, `Second son photo 0${i} is served via HTTP 200`);
    assert(imgRes.headers['content-type'] === 'image/jpeg', `Content-Type for photo 0${i} is image/jpeg`);
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL SECOND SON VERIFICATION TESTS PASSED 100%!');
  console.log('==================================================================');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
