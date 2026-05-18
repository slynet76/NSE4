/* Injects base64 PNG data URIs into lessons-v2-en/ JSON files.
 * Reads tools/pdf-slide-images/{id}.b64 for each lesson and sets diagrams[0].png.
 * Safe to re-run — skips lessons where png is already a real data URI. */
const fs = require('fs');
const path = require('path');

const EN_DIR = path.join(__dirname, 'lessons-v2-en');
const IMG_DIR = path.join(__dirname, 'pdf-slide-images');

let updated = 0;
let skipped = 0;
let missing = 0;

for (const file of fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'))) {
  const filePath = path.join(EN_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '');
  const lesson = JSON.parse(raw);

  if (!lesson.diagrams || lesson.diagrams.length === 0) {
    console.log(`  skip (no diagrams): ${file}`);
    skipped++;
    continue;
  }

  const d = lesson.diagrams[0];
  if (d.png && d.png.startsWith('data:image/png;base64,iVBOR')) {
    skipped++;
    continue;
  }

  const b64File = path.join(IMG_DIR, `${lesson.id}.b64`);
  if (!fs.existsSync(b64File)) {
    console.log(`  MISSING b64 for ${lesson.id}`);
    missing++;
    continue;
  }

  d.png = fs.readFileSync(b64File, 'ascii');
  fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2), 'utf8');
  console.log(`  injected PNG: ${file}`);
  updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Missing b64: ${missing}`);
