const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('==================================================================');
console.log('🖼️  VERIFYING MUM HERO PHOTO & NEVER-ENDING ZOOM LOOP');
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
const heroImagePath = path.join(rootDir, 'assets', 'images', 'hero-mum.jpg');
const styleCssPath = path.join(rootDir, 'css', 'style.css');

// 1. Verify Image File
const imgStats = fs.statSync(heroImagePath);
assert(imgStats.size > 200000, `hero-mum.jpg exists with high-res file size (${imgStats.size} bytes)`);

// 2. Verify CSS Rules in style.css
const cssContent = fs.readFileSync(styleCssPath, 'utf8');

assert(
  cssContent.includes('@keyframes heroKenBurnsLoop'),
  '@keyframes heroKenBurnsLoop defined in style.css'
);

assert(
  cssContent.includes('animation: heroKenBurnsLoop') && cssContent.includes('infinite'),
  '.hero-image-wrap img is configured with continuous infinite animation'
);

assert(
  !cssContent.includes('.hero-arch-container:hover .hero-image-wrap img'),
  'Hover-based scaling removed from .hero-arch-container'
);

assert(
  cssContent.includes('overflow: hidden;') && cssContent.includes('border-radius: 230px 230px 18px 18px;'),
  '.hero-image-wrap strictly confines zooming image inside the arch frame'
);

assert(
  cssContent.includes('transform: scale(1.08)'),
  'Zoom scale is controlled to prevent over-stretching (peak at 1.08)'
);

// 3. Verify Live HTTP Server Serving
function testHttp() {
  const reqImg = http.get('http://localhost:8000/assets/images/hero-mum.jpg', res => {
    assert(res.statusCode === 200, `Live server serves hero-mum.jpg (HTTP ${res.statusCode})`);
    assert(res.headers['content-type'] === 'image/jpeg', `MIME type is image/jpeg`);

    const reqCss = http.get('http://localhost:8000/css/style.css', resCss => {
      let data = '';
      resCss.on('data', chunk => data += chunk);
      resCss.on('end', () => {
        assert(data.includes('@keyframes heroKenBurnsLoop'), 'Live served CSS contains heroKenBurnsLoop animation');
        assert(!data.includes('.hero-arch-container:hover .hero-image-wrap img'), 'Live served CSS does not have hover zoom');

        console.log('\n==================================================================');
        console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('==================================================================');
        process.exit(failed > 0 ? 1 : 0);
      });
    });
    reqCss.on('error', err => {
      console.error('Failed to fetch CSS from server:', err);
      process.exit(1);
    });
  });

  reqImg.on('error', err => {
    console.error('Failed to fetch image from server:', err);
    process.exit(1);
  });
}

testHttp();
