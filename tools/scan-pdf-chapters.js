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
  return (result.text || '').split('\f');
}

function splitIntoSections(pages, chapterId, startPage) {
  const sections = [];
  let current = { titlePage: startPage, contentPages: [], lines: [], prevText: null };
  let lastPageText = null;

  for (let i = 0; i < pages.length; i++) {
    const pageNum = startPage + i;
    const text = pages[i];

    if (text.toLowerCase().includes('after completing this section') ||
        text.toLowerCase().includes('after completing this lesson')) {
      if (current.lines.length > 3) {
        sections.push({ ...current, endPage: pageNum - 1 });
      }
      current = { titlePage: pageNum, contentPages: [], lines: [], prevText: lastPageText };
    }

    current.lines.push(text);
    current.contentPages.push(pageNum);
    lastPageText = text;
  }

  if (current.lines.length > 0) {
    sections.push({ ...current, endPage: startPage + pages.length - 1 });
  }

  return sections.map((s, idx) => {
    // Title search: use only the FIRST page of the section (the "after completing" slide)
    // and optionally the page BEFORE it (stored as s.prevPage text in s.prevText)
    const firstPageText = s.lines[0] || '';
    let titleLine = null;

    // Pattern 1: Various "By demonstrating/understanding X" patterns on first page
    const competenceMatch = firstPageText.match(
      /By (?:demonstrating (?:competence in|a competent understanding of)|understanding an? )([^,\n.]+)/i
    );
    if (competenceMatch) {
      titleLine = competenceMatch[1].trim().replace(/,$/, '');
      titleLine = titleLine.charAt(0).toUpperCase() + titleLine.slice(1);
    }

    // Pattern 2: "Now, you will learn how to/about X." — on the PREVIOUS section's last page
    // That text appears as the last line of s.prevText (passed via splitIntoSections)
    if (!titleLine && s.prevText) {
      const nowMatch = s.prevText.match(/Now,\s+you will learn (?:how to |about )?(.+?)\.?\s*$/im);
      if (nowMatch && nowMatch[1].trim().split(' ').length > 1) {
        titleLine = nowMatch[1].trim();
        titleLine = titleLine.charAt(0).toUpperCase() + titleLine.slice(1);
      }
    }

    // Pattern 3: fallback - first readable line from first page
    if (!titleLine) {
      titleLine = firstPageText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 8 && l.length < 80 && !l.includes('FortiOS') && !l.includes('DO NOT') && !l.includes('©') && !l.includes('Study Guide') && !l.includes('Administrator') && !l.toLowerCase().includes('after completing') && !l.toLowerCase().includes('by demonstrating'))
        [0] || `Section ${idx + 1}`;
    }

    return {
      lesson: `${chapterId}-l${idx + 1}`,
      title: titleLine,
      startPage: s.titlePage,
      endPage: s.endPage,
      diagramPage: s.titlePage + 1,
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
