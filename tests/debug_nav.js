const { execFileSync } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const htmlTest = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="http://localhost:8000/css/style.css">
</head>
<body style="margin:0;padding:10px;">
  <nav class="site-nav" id="site-nav" aria-label="Keepsake Navigation">
    <div class="nav-mobile-bar">
      <span class="nav-mobile-title" id="nav-mobile-title">Our Mum</span>
      <button type="button" class="nav-toggle-btn" id="nav-toggle-btn" aria-label="Toggle Navigation Menu" aria-expanded="false">
        <span class="hamburger-line line-1"></span>
        <span class="hamburger-line line-2"></span>
        <span class="hamburger-line line-3"></span>
      </button>
    </div>
    <ul class="nav-links" id="nav-links-menu">
      <li><button type="button" class="nav-link active">Our Mum</button></li>
      <li><button type="button" class="nav-link">The Best Mum</button></li>
    </ul>
  </nav>
  <div id="debug"></div>
  <script>
    window.addEventListener('load', () => {
      const bar = document.querySelector('.nav-mobile-bar');
      const btn = document.querySelector('#nav-toggle-btn');
      const nav = document.querySelector('#site-nav');
      const title = document.querySelector('#nav-mobile-title');
      const links = document.querySelector('#nav-links-menu');
      document.getElementById('debug').textContent = JSON.stringify({
        windowWidth: window.innerWidth,
        nav: nav.getBoundingClientRect(),
        bar: bar.getBoundingClientRect(),
        btn: btn.getBoundingClientRect(),
        title: title.getBoundingClientRect(),
        linksDisplay: window.getComputedStyle(links).display,
        barDisplay: window.getComputedStyle(bar).display
      });
    });
  </script>
</body>
</html>
`;

require('fs').writeFileSync('tests/nav_debug.html', htmlTest);

const out = execFileSync(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=500,700',
  '--dump-dom',
  'file:///' + require('path').resolve('tests/nav_debug.html').replace(/\\/g, '/')
], { encoding: 'utf-8' });

console.log(out.match(/<div id="debug">(.*?)<\/div>/)?.[1]);
