const fs = require('fs');
const path = require('path');
const EN_DIR = path.join(__dirname, '../tools/lessons-v2-en');
let fixed = 0;
for (const file of fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'))) {
  const raw = fs.readFileSync(path.join(EN_DIR, file), 'utf8').replace(/^﻿/, '');
  const l = JSON.parse(raw);
  let changed = false;
  for (const arr of [l.questionPool, l.quiz]) {
    for (const q of (arr || [])) {
      if (!q.q && q.question) {
        q.q = q.question;
        delete q.question;
        delete q.id;
        delete q.explanation;
        changed = true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(path.join(EN_DIR, file), JSON.stringify(l, null, 2), 'utf8');
    fixed++;
    process.stdout.write('fixed ' + file + '\n');
  }
}
console.log('Done. Fixed', fixed, 'files.');
