// tests/test_mobile_responsiveness.js
// Automated verification of mobile & PC responsiveness & removal of Previous: Family Videos button

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '..');

function checkFile(relPath) {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
}

async function verify() {
  console.log("==================================================================");
  console.log("📱 VERIFYING MOBILE & PC RESPONSIVENESS AND BUTTON REMOVAL");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log("  ✅ PASS: " + message);
      passed++;
    } else {
      console.error("  ❌ FAIL: " + message);
      failed++;
    }
  }

  // 1. Verify "← Previous: Family Videos" is completely removed from index.html
  const indexHtml = checkFile('index.html');
  assert(!indexHtml.includes('Previous: Family Videos'), '"Previous: Family Videos" button is completely removed from index.html');
  assert(!indexHtml.includes('page-videos">&larr; Previous'), 'No backwards link to page-videos from wishes');

  // 2. Verify viewport-fit=cover on viewport meta
  assert(indexHtml.includes('viewport-fit=cover'), 'index.html includes viewport-fit=cover for iPhone notches & safe areas');

  // 3. Verify all redundant bottom chapter navigation buttons are removed from index.html
  assert(!indexHtml.includes('btn-chapter-nav'), 'All redundant bottom chapter navigation buttons are removed from index.html');
  assert(!indexHtml.includes('💌 Closed Envelope'), 'Closed Envelope button removed from hero page');

  // 4. Verify iOS Safari Auto-Zoom Fix in css/style.css
  const styleCss = checkFile('css/style.css');
  assert(styleCss.includes('font-size: 16px; /* Prevents iOS Safari auto-zoom */'), 'css/style.css specifies 16px font-size on inputs to stop iOS auto-zoom');

  // 5. Verify iOS Safari Auto-Zoom Fix in css/envelope.css
  const envelopeCss = checkFile('css/envelope.css');
  assert(envelopeCss.includes('font-size: 16px; /* Prevents iOS Safari auto-zoom */'), 'css/envelope.css specifies 16px font-size on passcode input');

  // 6. Verify zero horizontal overflow on html and body
  assert(styleCss.includes('overflow-x: hidden;') && styleCss.includes('max-width: 100vw;'), 'css/style.css guards html & body against horizontal scroll overflow');

  // 7. Verify safe-area-inset padding on body
  assert(styleCss.includes('env(safe-area-inset-bottom'), 'css/style.css includes safe-area-inset-bottom padding');

  // 8. Verify word-break on wish-body to prevent horizontal blowouts from long words
  assert(styleCss.includes('overflow-wrap: break-word;') && styleCss.includes('word-break: break-word;'), 'css/style.css adds word-break and overflow-wrap to .wish-body');

  // 9. Verify small screen envelope scaling in envelope.css
  assert(envelopeCss.includes('@media (max-width: 375px)'), 'css/envelope.css includes dedicated scaling for 375px and 320px screens');
  assert(envelopeCss.includes('@media (max-width: 480px)'), 'css/envelope.css includes dedicated scaling for 480px mobile screens');

  // 10. Verify comprehensive mobile media queries in css/style.css
  assert(styleCss.includes('@media (max-width: 900px)'), 'css/style.css includes tablet/mobile stacking for 900px');
  assert(styleCss.includes('@media (max-width: 768px)'), 'css/style.css includes 768px media query');
  assert(styleCss.includes('@media (max-width: 600px)'), 'css/style.css includes 600px smartphone media query');
  assert(styleCss.includes('@media (max-width: 380px)'), 'css/style.css includes 380px extra-small smartphone query');

  // 11. Verify .wishes-dynamic-panel is position: static on mobile
  assert(styleCss.includes('.wishes-dynamic-panel,') && styleCss.includes('position: static !important;'), '.wishes-dynamic-panel reverts to static position on mobile');

  // 12. Verify .wishes-nav-row centered on PC and mobile
  assert(styleCss.includes('.wishes-nav-row') && styleCss.includes('justify-content: center !important;'), '.wishes-nav-row is centered on PC and mobile');

  // 13. Verify server response
  console.log("\n--- Checking Live Server HTTP Response ---");
  const serverCheck = await new Promise((resolve) => {
    http.get('http://localhost:8000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });

  assert(serverCheck.status === 200, 'Server returns HTTP 200 for public homepage');
  assert(!serverCheck.html.includes('Previous: Family Videos'), 'Live server HTML does not contain "Previous: Family Videos"');

  console.log("\n==================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

verify().catch(e => {
  console.error("Verification error:", e);
  process.exit(1);
});
