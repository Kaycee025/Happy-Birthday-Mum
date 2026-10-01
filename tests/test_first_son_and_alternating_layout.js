const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('==================================================================');
console.log('👦 VERIFYING FIRST SON TRIBUTE & ALTERNATING LAYOUT');
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
const styleCssFile = path.join(rootDir, 'css', 'style.css');
const appJsFile = path.join(rootDir, 'js', 'app.js');
const firstSonDir = path.join(rootDir, 'assets', 'first-son');

// 1. Verify files exist in assets/first-son
assert(fs.existsSync(firstSonDir), 'assets/first-son directory exists');
const photos = fs.readdirSync(firstSonDir).filter(f => f.endsWith('.jpg'));
assert(photos.length === 3, `All 3 photos present in assets/first-son (found: ${photos.length})`);
const videos = fs.readdirSync(firstSonDir).filter(f => f.endsWith('.mp4'));
assert(videos.length === 3, `All 3 videos present in assets/first-son (found: ${videos.length})`);

// 2. Verify content.json
const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
assert(Array.isArray(content.childrenTributes), 'content.json contains childrenTributes array');
assert(content.childrenTributes.length >= 2, `childrenTributes has at least 2 children (found: ${content.childrenTributes.length})`);

const child2 = content.childrenTributes.find(c => c.childIndex === 2);
assert(child2, 'Child 2 (First Son) exists in childrenTributes');
assert(child2.role === 'First Son', 'Child 2 role is exactly First Son');
assert(child2.name === 'Kenechukwu (Kenebom)', 'Child 2 name is Kenechukwu (Kenebom)');
assert(child2.narrative.includes('Happy birthday mum'), 'Child 2 narrative has "Happy birthday mum"');
assert(child2.narrative.includes('supportive, caring'), 'Child 2 narrative has "supportive, caring"');
assert(child2.narrative.includes('Everyday should be a special day for you ❤️'), 'Child 2 narrative has heart and closing wish');
assert(child2.photos.length === 3, 'Child 2 has 3 photos');
assert(child2.videos.length === 3, 'Child 2 has 3 videos');

// 3. Verify CSS alternating rules and video pills
const styleCss = fs.readFileSync(styleCssFile, 'utf8');
assert(styleCss.includes('.child-tribute-row'), 'style.css defines .child-tribute-row');
assert(styleCss.includes('.child-tribute-row.reverse .story-text-card') && styleCss.includes('order: 1'), 'style.css orders text first on reverse rows (left side)');
assert(styleCss.includes('.child-tribute-row.reverse .child-media-card') && styleCss.includes('order: 2'), 'style.css orders media second on reverse rows (right side)');
assert(styleCss.includes('.video-selector-bar'), 'style.css defines .video-selector-bar');
assert(styleCss.includes('.video-pill'), 'style.css defines .video-pill');
assert(styleCss.includes('.slide-blur-bg'), 'style.css defines .slide-blur-bg for ambient backdrop');
assert(styleCss.includes('.slide-main-img') && styleCss.includes('object-fit: contain'), 'style.css sets object-fit: contain on main photo to prevent cutting off');

// 4. Verify JS app rendering and multi-video selector
const appJs = fs.readFileSync(appJsFile, 'utf8');
assert(appJs.includes('switchChildVideo'), 'app.js defines switchChildVideo');
assert(appJs.includes('child.childIndex % 2 === 0'), 'app.js alternates reverse class based on child index');
assert(appJs.includes('video-selector-bar'), 'app.js generates video-selector-bar when multiple videos exist');
assert(appJs.includes('slide-blur-bg') && appJs.includes('slide-main-img'), 'app.js renders both slide-blur-bg and slide-main-img');


// 5. Test Live Server Endpoints
http.get('http://localhost:8000/api/content', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const apiChild2 = json.childrenTributes.find(c => c.childIndex === 2);
    assert(apiChild2 && apiChild2.photos.length === 3, 'API returns Child 2 with 3 photos');
    assert(apiChild2 && apiChild2.videos.length === 3, 'API returns Child 2 with 3 videos');

    // Test byte-range streaming for son video
    http.get({
      host: 'localhost',
      port: 8000,
      path: '/assets/first-son/son-video-01.mp4',
      headers: { 'Range': 'bytes=0-2048' }
    }, vidRes => {
      assert(vidRes.statusCode === 206, `Son video-01 streams with HTTP 206 (got: ${vidRes.statusCode})`);
      assert(vidRes.headers['content-type'] === 'video/mp4', 'Son video content-type is video/mp4');
      assert(vidRes.headers['accept-ranges'] === 'bytes', 'Son video supports accept-ranges bytes');

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
