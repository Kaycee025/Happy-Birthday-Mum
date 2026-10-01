// tests/verify_birthday_wishes.js
// Automated verification script for Birthday Wishes system

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log("==================================================================");
  console.log("🧪 TESTING BIRTHDAY WISHES LOCK, TIME, YEAR & TOP-PREPEND SYSTEM");
  console.log("==================================================================");

  // 1. Initial Content Check
  console.log("\n[Test 1] Checking /api/content...");
  const contentRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/content',
    method: 'GET'
  });
  console.log("Status:", contentRes.statusCode);
  if (contentRes.statusCode !== 200) throw new Error("Failed to get content");
  console.log("Wishes count:", contentRes.json.wishes.length);
  console.log("Wishes unlocked for testing:", contentRes.json.settings.wishesUnlockedForTesting);

  // 2. Test Submission when locked (today is not Dec 23)
  console.log("\n[Test 2] Attempting submission while locked (should reject with 403)...");
  const lockTry = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/wishes',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Test Visitor',
    message: 'Testing locked state'
  });
  console.log("Status:", lockTry.statusCode, "Response:", lockTry.body);
  if (lockTry.statusCode !== 403) {
    throw new Error("Expected 403 while locked, got: " + lockTry.statusCode);
  }
  console.log("✅ Successfully enforced birthday lock!");

  // 3. Admin Login & Toggle Test Mode
  console.log("\n[Test 3] Logging in as Admin to toggle test mode...");
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'admin',
    password: 'MumLove2026!'
  });
  console.log("Login status:", loginRes.statusCode);
  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';
  if (!cookie) throw new Error("No session cookie returned");

  // Toggle Test Mode ON
  console.log("\n[Test 4] Enabling Simulation Test Mode via /api/admin/wishes/toggle-test-mode...");
  const toggleRes1 = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/wishes/toggle-test-mode',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json'
    }
  });
  console.log("Toggle status:", toggleRes1.statusCode, "Unlocked:", toggleRes1.json?.wishesUnlockedForTesting);
  if (!toggleRes1.json?.wishesUnlockedForTesting) {
    throw new Error("Failed to enable simulation test mode");
  }

  // 5. Submit Birthday Wish with Name, optional Phone, and Message
  console.log("\n[Test 5] Submitting live birthday wish via /api/wishes...");
  const wishPayload = {
    name: "Alexander K.",
    phone: "+1 (555) 987-6543",
    avatar: "🎂",
    message: "Dearest Mum, you are the world to us! Wishing you the happiest birthday filled with peace and laughter! 💖"
  };

  const submitRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/wishes',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, wishPayload);

  console.log("Submission status:", submitRes.statusCode);
  console.log("Submission result:", submitRes.json);
  if (submitRes.statusCode !== 200 || !submitRes.json?.success) {
    throw new Error("Failed to submit wish: " + submitRes.body);
  }

  const createdWish = submitRes.json.wish;
  console.log("\nCreated Wish details:");
  console.log("- ID:", createdWish.id);
  console.log("- Name:", createdWish.name);
  console.log("- Phone:", createdWish.phone);
  console.log("- Time:", createdWish.time);
  console.log("- Year:", createdWish.year);
  console.log("- Date:", createdWish.date);

  if (!createdWish.time) throw new Error("Wish missing time!");
  if (!createdWish.year) throw new Error("Wish missing year!");
  if (createdWish.phone !== wishPayload.phone) throw new Error("Wish missing phone!");

  // 6. Verify Wish is PREPENDED TO THE TOP (Index 0) on public site
  console.log("\n[Test 6] Fetching /api/content to verify wish appears at the TOP (Index 0)...");
  const contentRes2 = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/content',
    method: 'GET'
  });

  const firstWish = contentRes2.json.wishes[0];
  console.log("Top Wish in Guestbook:", firstWish.name, "-", firstWish.message.substring(0, 40) + "...");
  if (firstWish.id !== createdWish.id) {
    throw new Error("Expected newest wish to be at index 0 (the top), but found: " + firstWish.id);
  }
  console.log("✅ Verified: New wish is positioned at the very TOP of the stream!");

  // 7. Cleanup test wish
  console.log("\n[Test 7] Deleting test wish via /api/admin/wishes/delete...");
  const delRes = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/wishes/delete',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json'
    }
  }, { id: createdWish.id });
  console.log("Delete status:", delRes.statusCode, delRes.json?.message);

  // 8. Restore normal locked mode
  console.log("\n[Test 8] Restoring normal automatic schedule (locking back)...");
  const toggleRes2 = await makeRequest({
    hostname: 'localhost',
    port: 8000,
    path: '/api/admin/wishes/toggle-test-mode',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json'
    }
  });
  console.log("Restored. Unlocked:", toggleRes2.json?.wishesUnlockedForTesting);

  console.log("\n==================================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED!");
  console.log("==================================================================");
}

run().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
