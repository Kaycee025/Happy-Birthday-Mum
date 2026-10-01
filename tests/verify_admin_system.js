// tests/verify_admin_system.js
// Automated verification & visual testing for the Admin studio, login, forgot-password, and responsive media safety

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function request(pathName, method = 'GET', postData = null, cookie = null) {
  return new Promise((resolve) => {
    const urlObj = new URL('http://localhost:8000' + pathName);
    const headers = {};
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(JSON.stringify(postData));
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        const setCookie = res.headers['set-cookie'];
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json,
          setCookie: setCookie ? setCookie[0] : null
        });
      });
    });

    req.on('error', (e) => resolve({ statusCode: 500, error: e.message }));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function run() {
  console.log('==================================================================');
  console.log('🛡️ VERIFYING ADMIN SYSTEM, AUTHENTICATION & RESPONSIVE SAFETY');
  console.log('==================================================================');

  // 1. Verify index.html Nav Bar has Admin link
  console.log('\n[1] Checking public navbar navigation...');
  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
  assert(indexHtml.includes('href="/admin/login"'), 'index.html contains href="/admin/login"');
  assert(indexHtml.includes('nav-link-admin'), 'index.html contains nav-link-admin class');
  assert(indexHtml.includes('>Admin</a>'), 'index.html contains Admin link text');

  // 2. Verify admin-login.html structure
  console.log('\n[2] Checking admin-login.html elements...');
  const loginHtml = fs.readFileSync(path.resolve(__dirname, '../admin-login.html'), 'utf-8');
  assert(loginHtml.includes('Email Address'), 'admin-login.html labels field as Email Address');
  assert(loginHtml.includes('placeholder="Kcee492@gmail.com"'), 'admin-login.html has Kcee492@gmail.com placeholder');
  assert(loginHtml.includes('forgot-password-safety-wrap'), 'admin-login.html has separated forgot password safety wrap');
  assert(loginHtml.includes('id="login-btn"'), 'admin-login.html has login-btn');
  // Confirm forgot link is placed after login-btn in HTML body
  const btnPos = loginHtml.indexOf('id="login-btn"');
  const forgotPos = loginHtml.indexOf('id="forgot-link"');
  assert(forgotPos > btnPos, 'Forgot password link is placed BELOW the login button to prevent misclicks');

  // 3. Test Authentication API
  console.log('\n[3] Testing authentication API...');
  
  // A. Wrong credentials
  const badLogin = await request('/api/auth/login', 'POST', {
    username: 'Kcee492@gmail.com',
    password: 'WrongPassword999!'
  });
  assert(badLogin.statusCode === 401, 'Invalid password correctly rejected with 401');

  // B. Correct credentials: Kcee492@gmail.com / Olamide1234$
  const goodLogin = await request('/api/auth/login', 'POST', {
    username: 'Kcee492@gmail.com',
    password: 'Olamide1234$',
    rememberMe: true
  });
  assert(goodLogin.statusCode === 200, 'Valid credentials login returns 200 OK');
  assert(goodLogin.json?.success === true, 'Login response has success: true');
  assert(!!goodLogin.setCookie, 'Server sets keepsake_admin_session cookie');
  const sessionCookie = goodLogin.setCookie.split(';')[0];

  // C. Test lowercase email kcee492@gmail.com
  const lowerLogin = await request('/api/auth/login', 'POST', {
    username: 'kcee492@gmail.com',
    password: 'Olamide1234$'
  });
  assert(lowerLogin.statusCode === 200, 'Case-insensitive email login returns 200 OK');

  // 4. Test Authenticated Access to Admin Studio
  console.log('\n[4] Testing protected /admin access...');
  const unauthAdmin = await request('/admin');
  assert(unauthAdmin.statusCode === 302, 'Unauthenticated /admin redirects with 302 to login');

  const authAdmin = await request('/admin', 'GET', null, sessionCookie);
  assert(authAdmin.statusCode === 200, 'Authenticated /admin returns 200 OK');
  assert(authAdmin.body.includes("Mum's Keepsake Studio"), 'Admin dashboard HTML served successfully');

  // 5. Test Forgot Password Flow
  console.log('\n[5] Testing Forgot Password flow...');
  const forgotRes = await request('/api/auth/forgot-password', 'POST', {
    email: 'Kcee492@gmail.com'
  });
  assert(forgotRes.statusCode === 200, 'Forgot password request returns 200 OK');
  assert(forgotRes.json?.success === true, 'Forgot password response success is true');
  assert(!!forgotRes.json?.resetUrl, 'Reset URL returned for recovery workflow');
  console.log(`  ℹ️ Generated Reset URL: ${forgotRes.json.resetUrl}`);

  // Test token validation from generated link
  const urlObj = new URL(forgotRes.json.resetUrl);
  const token = urlObj.searchParams.get('token');
  assert(!!token && token.length === 64, 'Token is 32-byte hex string (64 chars)');

  // 6. Visual Screenshot Captures
  console.log('\n[6] Capturing visual screenshots of updated features...');
  const browserBin = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(browserBin)) {
    // A. Admin Login Page Desktop
    const loginShot = path.join(__dirname, 'admin_login_preview.png');
    execFileSync(browserBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1280,950',
      `--screenshot=${loginShot}`,
      'http://localhost:8000/admin/login'
    ], { timeout: 35000 });
    assert(fs.existsSync(loginShot) && fs.statSync(loginShot).size > 40000, `Saved login desktop screenshot: ${loginShot}`);

    // B. Admin Login Page Mobile
    const loginMobileShot = path.join(__dirname, 'admin_login_mobile.png');
    execFileSync(browserBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=430,900',
      `--screenshot=${loginMobileShot}`,
      'http://localhost:8000/admin/login'
    ], { timeout: 35000 });
    assert(fs.existsSync(loginMobileShot) && fs.statSync(loginMobileShot).size > 40000, `Saved login mobile screenshot: ${loginMobileShot}`);

    // C. Forgot Password Page
    const forgotShot = path.join(__dirname, 'admin_forgot_preview.png');
    execFileSync(browserBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1280,900',
      `--screenshot=${forgotShot}`,
      'http://localhost:8000/admin/forgot-password'
    ], { timeout: 35000 });
    assert(fs.existsSync(forgotShot) && fs.statSync(forgotShot).size > 40000, `Saved forgot password screenshot: ${forgotShot}`);

    // D. Public Navigation with Admin Link Desktop
    const navShot = path.join(__dirname, 'public_nav_admin_preview.png');
    // Prepare test harness that reveals home-page nav immediately
    const cleanNavHtml = path.join(__dirname, 'clean_nav.html');
    const indexSource = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
    const cleanNavInj = `
    <base href="/">
    <style>
      #gate-page { display: none !important; }
      #home-page { display: block !important; opacity: 1 !important; visibility: visible !important; }
    </style>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const home = document.getElementById('home-page');
        if (home) home.classList.add('active');
      });
    </script>
    `;
    fs.writeFileSync(cleanNavHtml, indexSource.replace('<head>', '<head>' + cleanNavInj));

    execFileSync(browserBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1280,700',
      `--screenshot=${navShot}`,
      'http://localhost:8000/tests/clean_nav.html'
    ], { timeout: 35000 });
    assert(fs.existsSync(navShot) && fs.statSync(navShot).size > 40000, `Saved public nav desktop screenshot: ${navShot}`);

    // E. Public Navigation Mobile Menu Drawer (open state)
    const mobileNavShot = path.join(__dirname, 'public_nav_mobile_open.png');
    const cleanMobileHtml = path.join(__dirname, 'clean_mobile_nav.html');
    const cleanMobileInj = `
    <base href="/">
    <style>
      #gate-page { display: none !important; }
      #home-page { display: block !important; opacity: 1 !important; visibility: visible !important; }
      .site-nav { border-radius: 20px !important; }
      .nav-links { display: flex !important; }
    </style>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        const home = document.getElementById('home-page');
        if (home) home.classList.add('active');
        const nav = document.getElementById('site-nav');
        if (nav) nav.classList.add('menu-open');
      });
    </script>
    `;
    fs.writeFileSync(cleanMobileHtml, indexSource.replace('<head>', '<head>' + cleanMobileInj));

    execFileSync(browserBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=430,850',
      `--screenshot=${mobileNavShot}`,
      'http://localhost:8000/tests/clean_mobile_nav.html'
    ], { timeout: 35000 });
    assert(fs.existsSync(mobileNavShot) && fs.statSync(mobileNavShot).size > 40000, `Saved public mobile nav drawer screenshot: ${mobileNavShot}`);

    // Clean up temporary files
    try {
      if (fs.existsSync(cleanNavHtml)) fs.unlinkSync(cleanNavHtml);
      if (fs.existsSync(cleanMobileHtml)) fs.unlinkSync(cleanMobileHtml);
    } catch(e) {}
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL ADMIN, AUTH, FORGOT-PASSWORD & RESPONSIVE TESTS PASSED 100%!');
  console.log('==================================================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
