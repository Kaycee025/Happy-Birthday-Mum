const fs = require('fs');
const content = fs.readFileSync('css/style.css', 'utf8');

let inComment = false;
let inString = false;
let stringChar = '';
let stack = [];
const lines = content.split('\n');

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  for (let col = 0; col < line.length; col++) {
    const ch = line[col];
    const next = line[col + 1];

    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        col++;
      }
      continue;
    }

    if (inString) {
      if (ch === stringChar && line[col - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '/' && next === '*') {
      inComment = true;
      col++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '{') {
      stack.push({ line: lineNum + 1, col: col + 1, preview: line.trim() });
    } else if (ch === '}') {
      if (stack.length === 0) {
        console.log('Unmatched closing } at line', lineNum + 1, 'col', col + 1);
      } else {
        stack.pop();
      }
    }
  }
}

console.log('Remaining unclosed { count:', stack.length);
stack.forEach(s => console.log('Unclosed { opened at line:', s.line, '->', s.preview));
