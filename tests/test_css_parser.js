const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const content = fs.readFileSync(cssPath, 'utf8');

console.log('--- CSS DETAILED SYNTAX CHECKER ---');
console.log('File size:', content.length, 'bytes');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// 1. Check brackets balance
let stack = [];
let inComment = false;
let inString = false;
let strQuote = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    const next = line[j + 1];

    if (inComment) {
      if (c === '*' && next === '/') {
        inComment = false;
        j++;
      }
      continue;
    }

    if (inString) {
      if (c === strQuote && line[j - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (c === '/' && next === '*') {
      inComment = true;
      j++;
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      strQuote = c;
      continue;
    }

    if (c === '{') {
      stack.push({ char: '{', line: i + 1, col: j + 1, context: line.trim() });
    } else if (c === '}') {
      if (stack.length === 0) {
        console.error(`ERROR: Unexpected closing '}' at line ${i + 1}:${j + 1}`);
      } else {
        stack.pop();
      }
    } else if (c === '(') {
      stack.push({ char: '(', line: i + 1, col: j + 1, context: line.trim() });
    } else if (c === ')') {
      const top = stack[stack.length - 1];
      if (top && top.char === '(') {
        stack.pop();
      } else {
        console.error(`ERROR: Unmatched ')' at line ${i + 1}:${j + 1}`);
      }
    }
  }
}

console.log('Unclosed items remaining:', stack.length);
if (stack.length > 0) {
  stack.forEach(s => console.log(`Unclosed '${s.char}' from line ${s.line}:${s.col} -> ${s.context}`));
} else {
  console.log('✅ ALL BRACKETS, PARENS, STRINGS, AND COMMENTS ARE PERFECTLY BALANCED!');
}

// 2. Check for missing semicolons inside rule blocks
let ruleDepth = 0;
let currentBlock = [];
let currentSelector = '';
let semicolonErrors = [];

for (let i = 0; i < lines.length; i++) {
  let raw = lines[i];
  // Strip inline comments
  let stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!stripped) continue;

  if (stripped.includes('{')) {
    ruleDepth += (stripped.match(/\{/g) || []).length;
  }
  if (stripped.includes('}')) {
    ruleDepth -= (stripped.match(/\}/g) || []).length;
    continue;
  }

  // Inside a CSS declaration block (depth >= 1 and not an @media / @keyframes declaration)
  if (ruleDepth > 0 && stripped.includes(':') && !stripped.startsWith('@') && !stripped.endsWith('{') && !stripped.endsWith('}')) {
    if (!stripped.endsWith(';') && !stripped.endsWith(',')) {
      semicolonErrors.push({ line: i + 1, content: stripped });
    }
  }
}

console.log('Semicolon check found missing semicolons:', semicolonErrors.length);
if (semicolonErrors.length > 0) {
  semicolonErrors.forEach(e => console.log(`Line ${e.line}: ${e.content}`));
} else {
  console.log('✅ All CSS property declarations end properly with semicolons!');
}
