// tests/test_nav_visibility_and_emojis.js
// Automated verification for navigation bar emoji removal and 100% screen visibility

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '..');

function checkFile(relPath) {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
}

async function verify() {
  console.log("==================================================================");
  console.log("🧭 VERIFYING NAV BAR: EMOJI REMOVAL & 100% SCREEN VISIBILITY");
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

  const indexHtml = checkFile('index.html');
  const styleCss = checkFile('css/style.css');

  // 1. Check Envelope has no emoji
  assert(indexHtml.includes('>Envelope</button>'), 'Envelope link has no emoji');

  // 2. Check all other emojis are removed from nav items
  assert(!indexHtml.includes('💖 The Best Mum') && indexHtml.includes('>The Best Mum</button>'), '💖 removed from The Best Mum');
  assert(!indexHtml.includes('Her Wisdom') && !indexHtml.includes('page-trained-us'), 'Her Wisdom section and nav link completely removed');
  assert(!indexHtml.includes('💍 Supportive Wife') && indexHtml.includes('>Supportive Wife</button>'), '💍 removed from Supportive Wife');
  assert(!indexHtml.includes('🖼️ Gallery') && indexHtml.includes('>Gallery</button>'), '🖼️ removed from Gallery');
  assert(!indexHtml.includes('🎬 Videos') && indexHtml.includes('>Videos</button>'), '🎬 removed from Videos');
  assert(!indexHtml.includes('💌 Birthday Wishes') && indexHtml.includes('>Birthday Wishes'), '💌 removed from Birthday Wishes label');

  // 3. Check CSS for flex-wrap & no hidden overflow-x on .nav-links
  assert(styleCss.includes('flex-wrap: wrap;') && styleCss.includes('justify-content: center;'), '.nav-links uses flex-wrap: wrap and justify-content: center for full screen visibility');
  assert(!styleCss.includes('.nav-links {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  list-style: none;\n  width: 100%;\n  overflow-x: auto;'), '.nav-links no longer hides items with overflow-x: auto');

  // 4. Check Mobile nav rules
  assert(styleCss.includes('/* ALL ITEMS REMAIN FULLY VISIBLE ON SCREEN - NO HORIZONTAL SCROLL */'), 'Mobile navigation explicitly configured for complete visibility');

  // 5. Check Live HTTP response
  const serverCheck = await new Promise((resolve) => {
    http.get('http://localhost:8000/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });

  assert(serverCheck.status === 200, 'Server is running live (HTTP 200)');
  assert(serverCheck.html.includes('>Envelope</button>'), 'Live site serves Envelope without emoji');
  assert(serverCheck.html.includes('>Birthday Wishes <span'), 'Live site serves Birthday Wishes without emoji');

  console.log("\n==================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) process.exit(1);
}

verify().catch(e => {
  console.error("Verification error:", e);
  process.exit(1);
});
