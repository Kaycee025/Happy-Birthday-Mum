const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const script = `
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.site-nav');
    const bar = document.querySelector('.nav-mobile-bar');
    const brand = document.querySelector('.nav-mobile-brand');
    const title = document.querySelector('.nav-mobile-title');
    const btn = document.querySelector('#nav-toggle-btn');
    const controls = document.querySelector('.nav-mobile-controls');
    document.title = JSON.stringify({
      winWidth: window.innerWidth,
      nav: nav ? { w: nav.offsetWidth, l: nav.offsetLeft, r: nav.offsetLeft + nav.offsetWidth } : null,
      bar: bar ? { w: bar.offsetWidth, l: bar.offsetLeft, r: bar.offsetLeft + bar.offsetWidth } : null,
      brand: brand ? { w: brand.offsetWidth } : null,
      title: title ? { w: title.offsetWidth, l: title.offsetLeft } : null,
      controls: controls ? { w: controls.offsetWidth, l: controls.offsetLeft } : null,
      btn: btn ? { w: btn.offsetWidth, l: btn.offsetLeft } : null
    });
  });
</script>
`;

const indexHtml = fs.readFileSync('index.html', 'utf8');
fs.writeFileSync('tests/measure_temp.html', indexHtml.replace('</head>', `${script}</head>`));

const out = execFileSync(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=390,844',
  '--dump-dom',
  'file:///' + path.resolve('tests/measure_temp.html').replace(/\\/g, '/')
], { encoding: 'utf8', timeout: 15000 });

const titleMatch = out.match(/<title>(.*?)<\/title>/);
if (titleMatch) {
  console.log('MEASURED VALUES:', titleMatch[1]);
}
