/* Apply per-lesson v2 JSON files (in tools/lessons-v2/) to src/data/lessons.json. */
const fs = require('fs');
const path = require('path');

const LESSONS = path.join(__dirname, '..', 'src', 'data', 'lessons.json');
const V2_DIR = path.join(__dirname, 'lessons-v2');

const lessons = JSON.parse(fs.readFileSync(LESSONS, 'utf8'));
const files = fs.readdirSync(V2_DIR).filter(f => f.endsWith('.json'));

let updated = 0;
for (const f of files) {
  const v2 = JSON.parse(fs.readFileSync(path.join(V2_DIR, f), 'utf8'));
  const i = lessons.findIndex(l => l.id === v2.id);
  if (i < 0) {
    console.error(`! Lesson id "${v2.id}" not found in lessons.json — skipped`);
    continue;
  }
  lessons[i] = v2;
  console.log(`✓ Updated ${v2.id} — ${v2.title}`);
  updated++;
}

fs.writeFileSync(LESSONS, JSON.stringify(lessons, null, 2) + '\n');
console.log(`\n${updated} lesson(s) applied to lessons.json (${lessons.length} total).`);
