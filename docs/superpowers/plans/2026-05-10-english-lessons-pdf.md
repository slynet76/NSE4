# English Lessons from PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all French NSE4 lessons with English lessons sourced from the official FortiOS 7.6 PDF, with real slide images extracted from the PDF.

**Architecture:** (1) Update `LessonScreen.tsx` to render PNG diagrams alongside SVG. (2) Python script extracts PDF page images. (3) Node.js script scans PDF text into section JSON. (4) Parallel agents generate English lesson JSON per chapter. (5) Apply + audit + release.

**Tech Stack:** React Native / Expo SDK 51, pymupdf (Python 3.11), pdf-parse (Node.js), parallel Claude agents.

---

## Task 1: PNG diagram support in LessonScreen

**Files:**
- Modify: `src/screens/LessonScreen.tsx` lines 1–48

- [ ] **Step 1: Add Image import**

In `src/screens/LessonScreen.tsx`, add `Image` to the React Native import on line 2:

```tsx
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, Image } from 'react-native';
```

- [ ] **Step 2: Update diagram renderer to support PNG**

Replace the `image` rule (lines 29–46) with:

```tsx
image: (node: any) => {
  const src: string = node.attributes?.src ?? '';
  const m = src.match(/^diagram:(\d+)$/);
  if (m && lesson.diagrams) {
    const i = Number(m[1]);
    const d = lesson.diagrams[i];
    if (d) {
      const w = width - 40;
      const h = d.height ?? Math.round(w * 0.6);
      return (
        <View key={node.key} style={styles.diagram}>
          {d.png ? (
            <Image
              source={{ uri: d.png }}
              style={{ width: w, height: h }}
              resizeMode="contain"
            />
          ) : (
            <SvgXml xml={d.svg} width={w} height={h} />
          )}
          {d.caption ? <Text style={styles.caption}>{d.caption}</Text> : null}
        </View>
      );
    }
  }
  return null;
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd C:\Users\admin\Documents\NSE4
npx tsc --noEmit 2>&1
```

Expected: no errors (or pre-existing errors only, nothing new).

- [ ] **Step 4: Commit**

```bash
git add src/screens/LessonScreen.tsx
git commit -m "feat: support base64 PNG diagrams alongside SVG in LessonScreen"
```

---

## Task 2: Scan PDF chapters into section JSON

**Files:**
- Create: `tools/scan-pdf-chapters.js`
- Output: `tools/pdf-sections.json`

- [ ] **Step 1: Create `tools/scan-pdf-chapters.js`**

```javascript
/* Scans each chapter of the FortiOS 7.6 PDF and identifies sections.
 * A new section starts when we detect "After completing this section" or
 * a slide whose ONLY content is a section title (short line after chapter header).
 * Output: tools/pdf-sections.json
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const PDF = 'C:/Users/admin/Downloads/FortiOS_7.6_Administrator_Study_Guide-Online.pdf';

// Chapter page ranges from TOC (start, end inclusive)
const CHAPTERS = [
  { id: 'ch01', module: 'System and Network Settings',                      start: 4,   end: 30  },
  { id: 'ch02', module: 'Logging and Monitoring',                           start: 31,  end: 67  },
  { id: 'ch03', module: 'Firewall Policies and NAT',                        start: 68,  end: 110 },
  { id: 'ch04', module: 'Routing',                                          start: 111, end: 141 },
  { id: 'ch05', module: 'Firewall Authentication',                          start: 142, end: 173 },
  { id: 'ch06', module: 'Fortinet Single Sign-On (FSSO)',                   start: 174, end: 215 },
  { id: 'ch07', module: 'Certificate Operations',                           start: 216, end: 249 },
  { id: 'ch08', module: 'Antivirus',                                        start: 250, end: 278 },
  { id: 'ch09', module: 'Web Filtering',                                    start: 279, end: 308 },
  { id: 'ch10', module: 'Intrusion Prevention and Application Control',     start: 309, end: 345 },
  { id: 'ch11', module: 'IPsec VPN',                                        start: 346, end: 401 },
  { id: 'ch12', module: 'SD-WAN Configuration and Monitoring',              start: 402, end: 444 },
  { id: 'ch13', module: 'High Availability',                                start: 445, end: 475 },
  { id: 'ch14', module: 'Diagnostics and Troubleshooting',                  start: 476, end: 506 },
  { id: 'ch15', module: 'FortiGate in the Cloud',                           start: 507, end: 534 },
  { id: 'ch16', module: 'FortiSASE',                                        start: 535, end: 601 },
];

const buf = fs.readFileSync(PDF);

async function extractPages(first, last) {
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText({ first, last });
  if (result.pages) return result.pages.map(p => (typeof p === 'string' ? p : p.text || ''));
  // fallback
  return (result.text || '').split('\f');
}

// Detect section boundaries: "After completing this section" signals a new section starts
// on the PREVIOUS objective/title slide.
function splitIntoSections(pages, chapterId, startPage) {
  const sections = [];
  let current = { titlePage: startPage, contentPages: [], lines: [] };

  for (let i = 0; i < pages.length; i++) {
    const pageNum = startPage + i;
    const text = pages[i];

    if (text.toLowerCase().includes('after completing this section')) {
      // New section starts here — save previous if it has content
      if (current.lines.length > 3) {
        sections.push({ ...current, endPage: pageNum - 1 });
      }
      current = { titlePage: pageNum, contentPages: [], lines: [] };
    }

    current.lines.push(text);
    current.contentPages.push(pageNum);
  }

  // Push last section
  if (current.lines.length > 0) {
    sections.push({ ...current, endPage: startPage + pages.length - 1 });
  }

  return sections.map((s, idx) => {
    // Extract section title: first short non-empty line after the module name
    const titleLine = s.lines
      .join('\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5 && l.length < 80 && !l.includes('FortiOS') && !l.includes('DO NOT') && !l.includes('©'))
      [0] || `Section ${idx + 1}`;

    return {
      lesson: `${chapterId}-l${idx + 1}`,
      title: titleLine,
      startPage: s.titlePage,
      endPage: s.endPage,
      diagramPage: s.titlePage + 1,  // slide after the objectives = usually the first diagram
      text: s.lines.join('\n\n---PAGE---\n\n'),
    };
  });
}

(async () => {
  const result = {};

  for (const ch of CHAPTERS) {
    console.log(`Scanning ${ch.id} (pages ${ch.start}-${ch.end})…`);
    const pages = await extractPages(ch.start, ch.end);
    const sections = splitIntoSections(pages, ch.id, ch.start);
    result[ch.id] = sections.map(s => ({
      lesson: s.lesson,
      module: ch.module,
      title: s.title,
      startPage: s.startPage,
      endPage: s.endPage,
      diagramPage: s.diagramPage,
    }));
    // Save full text separately (large — not in main JSON)
    for (const s of sections) {
      fs.writeFileSync(
        path.join(__dirname, `pdf-text-${s.lesson}.txt`),
        s.text,
        'utf8'
      );
    }
    console.log(`  → ${sections.length} sections`);
  }

  fs.writeFileSync(
    path.join(__dirname, 'pdf-sections.json'),
    JSON.stringify(result, null, 2),
    'utf8'
  );
  console.log('\nDone → tools/pdf-sections.json');
})();
```

- [ ] **Step 2: Run the scanner**

```powershell
cd C:\Users\admin\Documents\NSE4
& "C:\Program Files\nodejs\node.exe" tools/scan-pdf-chapters.js 2>&1
```

Expected output: 16 lines like `Scanning ch01 (pages 4-30)… → N sections`, then `Done → tools/pdf-sections.json`.

- [ ] **Step 3: Review the sections JSON**

```powershell
& "C:\Program Files\nodejs\node.exe" -e "
const s = require('./tools/pdf-sections.json');
for (const [ch, lessons] of Object.entries(s))
  console.log(ch + ': ' + lessons.map(l => l.lesson + ' — ' + l.title).join(' | '));
" 2>&1
```

Expected: each chapter shows its lessons with readable titles. If any title looks like garbage (e.g. `DO NOT REPRINT`), the section splitter needs tuning — adjust the `titleLine` filter in Step 1.

- [ ] **Step 4: Commit**

```bash
git add tools/scan-pdf-chapters.js tools/pdf-sections.json
git commit -m "feat: scan PDF chapters into section map (pdf-sections.json)"
```

---

## Task 3: Extract PDF slide images to PNG

**Files:**
- Create: `tools/extract-pdf-images.py`
- Output: `tools/pdf-slide-images/<lesson-id>.png` + `tools/pdf-slide-images/<lesson-id>.b64`

- [ ] **Step 1: Create `tools/extract-pdf-images.py`**

```python
"""
Renders one PDF page per lesson section as PNG using pymupdf,
saves both the PNG file and a base64 data URI text file.
Usage: python tools/extract-pdf-images.py
"""
import json, base64, os, sys
import fitz  # pymupdf

PDF_PATH = r"C:\Users\admin\Downloads\FortiOS_7.6_Administrator_Study_Guide-Online.pdf"
SECTIONS_JSON = os.path.join(os.path.dirname(__file__), "pdf-sections.json")
OUT_DIR = os.path.join(os.path.dirname(__file__), "pdf-slide-images")

os.makedirs(OUT_DIR, exist_ok=True)

with open(SECTIONS_JSON, encoding="utf-8") as f:
    sections = json.load(f)

doc = fitz.open(PDF_PATH)
total = sum(len(v) for v in sections.values())
done = 0

for ch_id, lessons in sections.items():
    for lesson in lessons:
        lesson_id = lesson["lesson"]
        # PDF pages are 0-indexed in pymupdf; our JSON uses 1-indexed pages
        page_num = lesson["diagramPage"] - 1
        page_num = max(0, min(page_num, len(doc) - 1))

        page = doc[page_num]
        # Render at 1.5x zoom for decent resolution without huge file size
        mat = fitz.Matrix(1.5, 1.5)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)

        # Save PNG
        png_path = os.path.join(OUT_DIR, f"{lesson_id}.png")
        pix.save(png_path)

        # Save base64 data URI
        with open(png_path, "rb") as imgf:
            b64 = base64.b64encode(imgf.read()).decode("ascii")
        data_uri = f"data:image/png;base64,{b64}"
        b64_path = os.path.join(OUT_DIR, f"{lesson_id}.b64")
        with open(b64_path, "w", encoding="ascii") as f2:
            f2.write(data_uri)

        done += 1
        print(f"[{done}/{total}] {lesson_id} (page {page_num + 1}) → {len(b64)} chars b64")

doc.close()
print(f"\nDone. {done} images in {OUT_DIR}")
```

- [ ] **Step 2: Run the image extractor**

```powershell
python tools/extract-pdf-images.py 2>&1
```

Expected: `[1/N] ch01-l1 (page X) → YYYYY chars b64` for each lesson, ending with `Done. N images`.

- [ ] **Step 3: Verify output**

```powershell
Get-ChildItem tools/pdf-slide-images/*.png | Measure-Object | Select-Object Count
```

Expected: count equals total number of lessons in `pdf-sections.json`.

- [ ] **Step 4: Add to .gitignore (images are large)**

Add to `.gitignore`:
```
tools/pdf-slide-images/
tools/pdf-text-*.txt
```

```powershell
cd C:\Users\admin\Documents\NSE4
Add-Content .gitignore "`ntools/pdf-slide-images/"
Add-Content .gitignore "tools/pdf-text-*.txt"
```

- [ ] **Step 5: Commit**

```bash
git add tools/extract-pdf-images.py .gitignore
git commit -m "feat: Python script to extract PDF slide images as base64 PNG"
```

---

## Task 4: Generate English lesson JSON files (parallel agents)

**Files:**
- Create: `tools/generate-en-lessons.js` (orchestrator)
- Create: `tools/lessons-v2-en/<lesson-id>.json` (one per lesson, via agents)
- Create: `tools/apply-en-lessons.js`

- [ ] **Step 1: Create `tools/apply-en-lessons.js`**

```javascript
/* Applies all tools/lessons-v2-en/*.json into src/data/lessons.json
 * Same logic as apply-lesson-updates.js but reads from lessons-v2-en/ */
const fs = require('fs'), path = require('path');
const EN = path.join(__dirname, 'lessons-v2-en');
const LESSONS = path.join(__dirname, '..', 'src', 'data', 'lessons.json');

const lessons = JSON.parse(fs.readFileSync(LESSONS, 'utf8'));
let applied = 0;

for (const file of fs.readdirSync(EN).filter(f => f.endsWith('.json'))) {
  const l = JSON.parse(fs.readFileSync(path.join(EN, file), 'utf8'));
  const idx = lessons.findIndex(x => x.id === l.id);
  if (idx >= 0) {
    lessons[idx] = l;
  } else {
    lessons.push(l);
  }
  applied++;
  console.log(`✓ Applied ${l.id} — ${l.title}`);
}

lessons.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(LESSONS, JSON.stringify(lessons, null, 2), 'utf8');
console.log(`\n${applied} EN lessons applied to lessons.json (${lessons.length} total).`);
```

- [ ] **Step 2: Create orchestrator `tools/generate-en-lessons.js`**

This script reads `pdf-sections.json` and the extracted text files, then prints the data needed for each agent (to be launched manually in parallel):

```javascript
/* Prints a summary of what each agent needs to generate.
 * Run to see the chapter list; then launch agents manually per chapter. */
const fs = require('fs'), path = require('path');
const sections = require('./pdf-sections.json');

for (const [ch, lessons] of Object.entries(sections)) {
  console.log(`\n=== ${ch}: ${lessons.length} lessons ===`);
  for (const l of lessons) {
    const txtFile = path.join(__dirname, `pdf-text-${l.lesson}.txt`);
    const b64File = path.join(__dirname, 'pdf-slide-images', `${l.lesson}.b64`);
    const hasText = fs.existsSync(txtFile);
    const hasImg = fs.existsSync(b64File);
    console.log(`  ${l.lesson}: "${l.title}" | text:${hasText} img:${hasImg}`);
  }
}
```

```powershell
& "C:\Program Files\nodejs\node.exe" tools/generate-en-lessons.js 2>&1
```

Expected: chapter-by-chapter listing confirming text and image files exist for each lesson.

- [ ] **Step 3: Archive French v2 files**

```powershell
cd C:\Users\admin\Documents\NSE4
New-Item -ItemType Directory -Force tools/lessons-v2-fr
Copy-Item tools/lessons-v2/*.json tools/lessons-v2-fr/
Write-Host "Archived $(Get-ChildItem tools/lessons-v2-fr/*.json | Measure-Object | Select-Object -ExpandProperty Count) FR lessons"
```

- [ ] **Step 4: Create `tools/lessons-v2-en/` directory**

```powershell
New-Item -ItemType Directory -Force tools/lessons-v2-en
```

- [ ] **Step 5: Launch parallel agents for all 16 chapters**

For each chapter, launch one agent with the following prompt template (replace `{chXX}`, `{module}`, `{lessons_list}`, `{text_and_images}` with actual values read from `pdf-sections.json` and the extracted text/b64 files).

**Agent prompt template:**

```
Write English NSE4 lesson JSON files for chapter {chXX} ({module}).
Save each to C:\Users\admin\Documents\NSE4\tools\lessons-v2-en\<id>.json

## Format (strict)
{
  "id": "ch01-l1",
  "module": "{module}",
  "title": "...",
  "durationMin": 7,
  "content": "## Heading\n\ncontent with **bold**...\n\n![caption](diagram:0)\n\n## More content",
  "diagrams": [{ "caption": "...", "height": 300, "png": "<BASE64_DATA_URI>" }],
  "questionPool": [{"q":"...","choices":["a","b","c","d"],"answer":0,"explain":"..."}],
  "quiz": [... 5 questions subset ...]
}

Rules:
- content: English markdown 400-600 words, include ![caption](diagram:0) after first ## section
- diagrams[0].png: use the EXACT base64 data URI provided below (do not modify it)
- diagrams[0].caption: a short description of what the image shows
- diagrams[0].height: 300
- questionPool: exactly 15 questions in English
- quiz: exactly 5 questions (verbatim subset of questionPool)
- AUDIT: every correct answer must be findable in content (substring or 60% tokens)
- ALL-CAPS abbreviations in answers must appear word-boundary in content

## Lessons to write

{for each lesson:}
### {lesson.lesson} — "{lesson.title}"

PDF text:
---
{contents of pdf-text-{lesson.lesson}.txt — first 3000 chars}
---

diagrams[0].png (paste this EXACTLY as the png field):
{contents of pdf-slide-images/{lesson.lesson}.b64}
```

Launch one agent per chapter (16 agents in parallel). Each agent writes its chapter's lesson files.

- [ ] **Step 6: Commit tools**

```bash
git add tools/apply-en-lessons.js tools/generate-en-lessons.js tools/lessons-v2-fr/
git commit -m "feat: EN lesson tooling — apply-en-lessons, generate-en-lessons, archive FR v2"
```

---

## Task 5: Apply, audit, fix, and release

**Files:**
- Modify: `src/data/lessons.json` (replaced with EN content)
- Run: `tools/audit-lessons.js` (unchanged, works for EN too)

- [ ] **Step 1: Verify all EN lesson files exist**

```powershell
$sections = (& "C:\Program Files\nodejs\node.exe" -e "
const s=require('./tools/pdf-sections.json');
let t=0; for(const v of Object.values(s)) t+=v.length;
console.log(t);
" 2>&1)
$files = (Get-ChildItem tools/lessons-v2-en/*.json | Measure-Object).Count
Write-Host "Expected: $sections | Found: $files"
```

Expected: both numbers match.

- [ ] **Step 2: Apply EN lessons to lessons.json**

```powershell
& "C:\Program Files\nodejs\node.exe" tools/apply-en-lessons.js 2>&1 | Select-Object -Last 3
```

Expected: `N EN lessons applied to lessons.json (N total).`

- [ ] **Step 3: Run audit**

```powershell
& "C:\Program Files\nodejs\node.exe" tools/audit-lessons.js 2>&1 | Select-Object -First 6
```

Expected: `0/N broken (0.0%)`. If there are broken questions, proceed to Step 4.

- [ ] **Step 4: Fix broken questions (if any)**

For each broken question reported, create `tools/patch-en-round1.js` following the established pattern:

```javascript
const fs = require('fs'), path = require('path');
const EN = path.join(__dirname, 'lessons-v2-en');

function pV2(id, fn) {
  const file = path.join(EN, id + '.json');
  if (!fs.existsSync(file)) { console.warn('SKIP ' + id); return; }
  const l = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (fn(l)) { fs.writeFileSync(file, JSON.stringify(l, null, 2), 'utf8'); console.log('patched ' + id); }
}

function fixQ(qs, oldAns, newAns) {
  for (const q of qs) {
    if (q.choices[q.answer] === oldAns) { q.choices[q.answer] = newAns; return true; }
  }
  return false;
}

// Add fixes here based on audit output, e.g.:
// pV2('ch01-l1', l => fixQ(l.questionPool, 'old answer', 'new answer that matches content'));

console.log('done');
```

Run: `& "C:\Program Files\nodejs\node.exe" tools/patch-en-round1.js`  
Then re-run Steps 2–3 until 0 broken.

- [ ] **Step 5: Verify diagram refs present in all EN lessons**

```powershell
& "C:\Program Files\nodejs\node.exe" -e "
const fs=require('fs'),path=require('path');
const EN='tools/lessons-v2-en';
let missing=0;
for(const f of fs.readdirSync(EN).filter(f=>f.endsWith('.json'))){
  const l=JSON.parse(fs.readFileSync(path.join(EN,f),'utf8'));
  if(l.diagrams&&l.diagrams.length&&!l.content.includes('diagram:0')){
    console.log('missing diagram:0 ref: '+l.id); missing++;
  }
}
console.log(missing+' missing');
" 2>&1
```

If any missing, run `tools/inject-diagram-refs.js` (adapted to read from `lessons-v2-en/`):

```powershell
& "C:\Program Files\nodejs\node.exe" -e "
const fs=require('fs'),path=require('path');
const EN=path.join('tools','lessons-v2-en');
let fixed=0;
for(const file of fs.readdirSync(EN).filter(f=>f.endsWith('.json'))){
  const l=JSON.parse(fs.readFileSync(path.join(EN,file),'utf8'));
  if(!l.diagrams||!l.diagrams.length||l.content.includes('diagram:0')) continue;
  const caption=l.diagrams[0].caption||'Diagram';
  const ref='\n\n!['+caption+'](diagram:0)\n';
  const secondH2=l.content.indexOf('\n## ',l.content.indexOf('\n## ')+4);
  if(secondH2!==-1) l.content=l.content.slice(0,secondH2)+ref+l.content.slice(secondH2);
  else l.content+=ref;
  fs.writeFileSync(path.join(EN,file),JSON.stringify(l,null,2),'utf8');
  console.log('fixed '+l.id); fixed++;
}
console.log(fixed+' fixed');
" 2>&1
```

- [ ] **Step 6: Final audit confirmation**

```powershell
& "C:\Program Files\nodejs\node.exe" tools/apply-en-lessons.js 2>&1 | Select-Object -Last 2
& "C:\Program Files\nodejs\node.exe" tools/audit-lessons.js 2>&1 | Select-Object -First 4
```

Expected: `0/N broken (0.0%)`.

- [ ] **Step 7: Commit all EN lessons**

```bash
git add src/data/lessons.json tools/lessons-v2-en/ tools/apply-en-lessons.js
git commit -m "feat: replace FR lessons with English v2 from FortiOS 7.6 PDF — N lessons, 0 broken"
```

- [ ] **Step 8: Tag and release**

```powershell
cd C:\Users\admin\Documents\NSE4
git tag v0.4.0
git push origin claude/brainstorming-gSD0e
git push origin v0.4.0
```

Expected: GitHub Actions builds APK v0.4.0 in ~9 minutes at `https://github.com/slynet76/NSE4/releases/tag/v0.4.0`.

---

## Self-Review

**Spec coverage check:**
- ✅ PNG support in app (Task 1)
- ✅ PDF structure scan (Task 2)
- ✅ PDF image extraction (Task 3)
- ✅ English lesson generation with real PNG (Task 4)
- ✅ Apply + audit + fix + release (Task 5)
- ✅ FR lessons archived (Task 4 Step 3)
- ✅ Backwards compatible (SVG still works for any remaining FR lessons)

**No placeholders:** All steps have exact code or commands.

**Type consistency:** `d.png` string field used consistently in Task 1 and Task 4 JSON schema.
