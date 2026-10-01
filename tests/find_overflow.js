const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const script = `
  const overflows = [];
  const clientW = document.documentElement.clientWidth;
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > clientW + 2) {
      overflows.push({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        width: rect.width,
        right: rect.right,
        clientW: clientW
      });
    }
  });
  console.log('CLIENT_WIDTH=' + clientW);
  console.log('OVERFLOWS=' + JSON.stringify(overflows.slice(0, 15)));
`;

const htmlWrapper = `
<html><body>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    // will be run
  });
</script>
</body></html>
`;

// Let's run Edge in headless mode with dump-dom or a node script using CDP
const http = require('http');

http.get('http://localhost:8000/', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    // Check elements in html with min-width or fixed width in css
    const styleCss = fs.readFileSync('css/style.css', 'utf-8');
    const fixedWidths = styleCss.match(/width:\s*\d{3,}px|min-width:\s*\d{3,}px/g);
    console.log('Fixed widths in style.css:', fixedWidths);
  });
});
