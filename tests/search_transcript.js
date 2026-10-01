const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/pc/.gemini/antigravity-ide/brain/4306210b-9ebf-414f-abd5-5f0af5bda2d8/.system_generated/logs/transcript.jsonl')
});

let found = [];
rl.on('line', line => {
  if (line.includes('2176')) {
    found.push(line);
  }
});

rl.on('close', () => {
  console.log('Occurrences of 2176:', found.length);
  found.forEach((f, idx) => {
    try {
      const obj = JSON.parse(f);
      console.log(`[${idx}] step: ${obj.step_index}, type: ${obj.type}`);
      if (obj.content) console.log('Content snippet:', obj.content.substring(0, 200));
    } catch(e) {
      console.log(`[${idx}] snippet:`, f.substring(0, 150));
    }
  });
});
