const { execFileSync } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const htmlTest = `
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="http://localhost:8000/css/style.css">
</head>
<body>
<div id="info"></div>
<script>
window.addEventListener('load', () => {
  const mq768 = window.matchMedia('(max-width: 768px)').matches;
  const mq600 = window.matchMedia('(max-width: 600px)').matches;
  document.getElementById('info').textContent = JSON.stringify({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    mq768,
    mq600
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync('tests/dom_test.html', htmlTest);

const out = execFileSync(edgePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=375,667',
  '--dump-dom',
  'file:///' + require('path').resolve('tests/dom_test.html').replace(/\\/g, '/')
], { encoding: 'utf-8' });

console.log('DOM output:', out);
