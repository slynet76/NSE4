/* Replace src/data/lessons.json with all 45 English lessons from tools/lessons-v2-en/.
 * Archives FR lessons to tools/lessons-v2-fr/ before replacing. */
const fs = require('fs');
const path = require('path');

const LESSONS = path.join(__dirname, '..', 'src', 'data', 'lessons.json');
const EN_DIR = path.join(__dirname, 'lessons-v2-en');
const FR_DIR = path.join(__dirname, 'lessons-v2-fr');
const V2_DIR = path.join(__dirname, 'lessons-v2');

// Archive FR v2 lessons if not already done
if (fs.existsSync(V2_DIR)) {
  fs.mkdirSync(FR_DIR, { recursive: true });
  const frFiles = fs.readdirSync(V2_DIR).filter(f => f.endsWith('.json'));
  for (const f of frFiles) {
    const dest = path.join(FR_DIR, f);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(V2_DIR, f), dest);
    }
  }
  console.log(`Archived ${frFiles.length} FR lessons to tools/lessons-v2-fr/`);
}

// Load all EN lessons
const enFiles = fs.readdirSync(EN_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

const enLessons = enFiles.map(f => {
  const raw = fs.readFileSync(path.join(EN_DIR, f), 'utf8').replace(/^﻿/, '');
  return JSON.parse(raw);
});

// Write as new lessons.json
fs.writeFileSync(LESSONS, JSON.stringify(enLessons, null, 2) + '\n');
console.log(`\nReplaced lessons.json with ${enLessons.length} English lessons.`);
enLessons.forEach(l => console.log(`  ✓ ${l.id} — ${l.title}`));
