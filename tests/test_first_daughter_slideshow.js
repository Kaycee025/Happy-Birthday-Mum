const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('==================================================================');
console.log('📸 VERIFYING FIRST DAUGHTER SLIDESHOW & VIDEO STREAMING');
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
const mediaDir = path.join(rootDir, 'assets', 'first-daughter');

// 1. Verify files exist in assets/first-daughter
assert(fs.existsSync(mediaDir), 'assets/first-daughter directory exists');
const photos = fs.readdirSync(mediaDir).filter(f => f.endsWith('.jpg'));
assert(photos.length === 12, `All 12 photos copied (found: ${photos.length})`);
const videoPath = path.join(mediaDir, 'lolo-video.mp4');
assert(fs.existsSync(videoPath) && fs.statSync(videoPath).size > 1000000, 'lolo-video.mp4 exists (> 1MB)');

// 2. Verify js/app.js logic
const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');
assert(appJs.includes('initChildSlideshow'), 'app.js contains initChildSlideshow');
assert(appJs.includes('switchChildMediaMode'), 'app.js contains switchChildMediaMode');
assert(appJs.includes('nextSlide') && appJs.includes('prevSlide'), 'app.js contains nextSlide and prevSlide');
assert(!appJs.includes("'Video Message'"), 'app.js does not contain "Video Message"');
assert(appJs.includes(": 'Video'"), 'app.js uses concise "Video" tab label');

// 3. Verify css/style.css rules
const styleCss = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');
assert(styleCss.includes('.child-media-card'), 'style.css defines .child-media-card');
assert(styleCss.includes('.slideshow-control-bar'), 'style.css defines .slideshow-control-bar');
assert(styleCss.includes('.slideshow-btn'), 'style.css defines .slideshow-btn');

// 4. Test Live Server Endpoints
function runServerChecks() {
  // Test /api/content
  http.get('http://localhost:8000/api/content', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      const bestMum = json.sections.find(s => s.id === 'best-mum');
      assert(bestMum && bestMum.title === 'Lolo (Ada Ukwuaziza)', 'Best Mum section title is Lolo (Ada Ukwuaziza)');
      assert(bestMum && bestMum.photos && bestMum.photos.length === 12, 'Best Mum contains 12 photos array');
      assert(bestMum && bestMum.video.includes('lolo-video.mp4'), 'Best Mum contains video link');

      // Test Video HTTP 206 Byte Streaming
      const vidReq = http.get({
        host: 'localhost',
        port: 8000,
        path: '/assets/first-daughter/lolo-video.mp4',
        headers: { 'Range': 'bytes=0-1024' }
      }, vidRes => {
        assert(vidRes.statusCode === 206, `Video streams with HTTP 206 Partial Content (got: ${vidRes.statusCode})`);
        assert(vidRes.headers['accept-ranges'] === 'bytes', 'Video supports Accept-Ranges: bytes');
        assert(vidRes.headers['content-type'] === 'video/mp4', 'MIME type is video/mp4');

        console.log('\n==================================================================');
        console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('==================================================================');
        process.exit(failed > 0 ? 1 : 0);
      });

      vidReq.on('error', err => {
        console.error('Video request error:', err);
        process.exit(1);
      });
    });
  }).on('error', err => {
    console.error('Content request error:', err);
    process.exit(1);
  });
}

runServerChecks();
