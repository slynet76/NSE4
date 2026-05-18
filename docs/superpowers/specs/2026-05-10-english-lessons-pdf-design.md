# English Lessons from PDF — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

## Goal

Replace all 83 French NSE4 lessons with English lessons sourced directly from the official *FortiOS 7.6 Administrator Study Guide* PDF (601 pages). Lesson structure follows the PDF's section organization. Each lesson includes the actual slide image from the PDF (not a hand-crafted SVG).

## Decisions

| Question | Decision |
|---|---|
| Replace FR or add alongside | Replace |
| Lesson structure | Reorganize per PDF sections (may differ from 83) |
| Images | Extract real PNG from PDF, embed as base64 |

---

## Section 1 — JSON Schema Change (backwards-compatible)

The `diagrams[]` array gains an optional `png` field:

```json
{
  "diagrams": [{
    "caption": "FortiGate Architecture",
    "height": 300,
    "png": "data:image/png;base64,iVBOR..."
  }]
}
```

- If `png` is present → render with React Native `<Image>` component
- If only `svg` is present → render with `<SvgXml>` (existing FR lessons unchanged during transition)
- Both fields can coexist; `png` takes priority

The existing `inject-diagram-refs.js` logic (`![caption](diagram:0)` in markdown) is unchanged — the renderer just switches output based on field presence.

---

## Section 2 — App Component Update

**File to modify:** `src/components/LessonContent.tsx` (or wherever `diagram:N` images are rendered).

Change the diagram renderer:
```tsx
// Before
<SvgXml xml={diagram.svg} ... />

// After
if (diagram.png) {
  <Image source={{ uri: diagram.png }} style={{ height: diagram.height }} resizeMode="contain" />
} else {
  <SvgXml xml={diagram.svg} ... />
}
```

No other app changes needed. The `![caption](diagram:0)` markdown syntax is unchanged.

---

## Section 3 — PDF Processing Pipeline

Three new scripts in `tools/`:

### `tools/scan-pdf-chapters.js`
- Input: `C:/Users/admin/Downloads/FortiOS_7.6_Administrator_Study_Guide-Online.pdf`
- Reads each chapter using known page ranges (from TOC):
  - ch01: 4–30, ch02: 31–67, ch03: 68–110, ch04: 111–141
  - ch05: 142–173, ch06: 174–215, ch07: 216–249, ch08: 250–278
  - ch09: 279–308, ch10: 309–345, ch11: 346–401, ch12: 402–444
  - ch13: 445–475, ch14: 476–506, ch15: 507–534, ch16: 535–601
- Identifies section breaks by scanning for the pattern `"After completing this section"` or numbered objective slides
- Output: `tools/pdf-sections.json`

```json
{
  "ch01": [
    { "lesson": "ch01-l1", "title": "Basic System and Network Administration", "startPage": 4, "endPage": 14, "diagramPage": 8 },
    { "lesson": "ch01-l2", "title": "Basic Administration", "startPage": 15, "endPage": 30, "diagramPage": 18 }
  ],
  ...
}
```

### `tools/extract-pdf-slide-images.js`
- Input: `tools/pdf-sections.json` + PDF
- For each section's `diagramPage`, renders that PDF page to PNG using `pdfjs-dist` + `canvas`
- Output: `tools/pdf-slide-images/ch01-l1.png` (one PNG per lesson)
- Falls back to the section's `startPage` if `diagramPage` is not set

### `tools/apply-en-lessons.js`  
- Reads all JSON from `tools/lessons-v2-en/`
- Updates `src/data/lessons.json` (full replace, same logic as `apply-lesson-updates.js`)

---

## Section 4 — Lesson Generation

### Output directory: `tools/lessons-v2-en/`

Each lesson JSON:
```json
{
  "id": "ch01-l1",
  "module": "System and Network Settings",
  "title": "Basic System and Network Administration",
  "durationMin": 7,
  "content": "## Section heading\n\nEnglish markdown from PDF text...",
  "diagrams": [{
    "caption": "...",
    "height": 300,
    "png": "data:image/png;base64,..."
  }],
  "questionPool": [ ...15 EN questions... ],
  "quiz": [ ...5 subset... ]
}
```

### Generation workflow
1. Run `scan-pdf-chapters.js` → `pdf-sections.json`
2. Run `extract-pdf-slide-images.js` → PNG files per lesson
3. Launch parallel agents (one per chapter, 16 total) — each agent:
   - Receives: chapter text from PDF + base64 PNG for each section
   - Writes: `tools/lessons-v2-en/chXX-lY.json` files
4. Run `apply-en-lessons.js` → replaces `lessons.json`
5. Run `audit-lessons.js` (adapted for EN) → fix any broken questions
6. Commit + tag

### Audit compliance (same rules as FR)
- Correct answers must be findable in lesson content (substring or 60% tokens)
- ALL-CAPS abbreviations in answers must appear in content

---

## Section 5 — Data Migration

- Existing FR progress data (streak, completed lessons) is **reset** — lesson IDs may change count/order
- FR `tools/lessons-v2/` files are **archived** (moved to `tools/lessons-v2-fr/`) not deleted
- `src/data/lessons.json` is replaced with English content

---

## Out of Scope

- Language toggle (EN/FR switch in app)
- iOS support
- Store publication
