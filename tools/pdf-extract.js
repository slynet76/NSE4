/* Usage: node tools/pdf-extract.js <pageStart> <pageEnd> [outFile]
 * Extracts text from a page range of _nse4.pdf and writes to stdout or file.
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const [, , startArg, endArg, out] = process.argv;
const start = parseInt(startArg, 10) || 1;
const end = parseInt(endArg, 10) || start;

const buf = fs.readFileSync(path.join(__dirname, '..', '_nse4.pdf'));

(async () => {
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText({ first: start, last: end });
  // Result is { text, numpages, pages: [...] } or similar; print best-effort
  let txt = '';
  if (result.pages) {
    for (const p of result.pages) {
      txt += `\n===== PAGE ${p.pageNumber} =====\n${p.text}\n`;
    }
  } else {
    txt = result.text || JSON.stringify(result).slice(0, 500);
  }
  if (out) fs.writeFileSync(out, txt);
  else process.stdout.write(txt);
  process.stderr.write(`\n[pdf-extract] total: ${result.total || result.numpages || '?'}, extracted: ${start}-${end}\n`);
  await parser.destroy?.();
})();
