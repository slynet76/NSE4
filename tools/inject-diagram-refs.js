/* Injecte ![caption](diagram:0) dans chaque leçon v2 qui a un diagrams[] mais
 * pas de référence diagram:0 dans le content.
 * Position : juste avant le 2e heading ## (entre la 1ère et 2e section). */
const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, 'lessons-v2');
let fixed = 0;

for (const file of fs.readdirSync(V2).filter(f => f.endsWith('.json'))) {
  const l = JSON.parse(fs.readFileSync(path.join(V2, file), 'utf8'));
  if (!l.diagrams || l.diagrams.length === 0) continue;
  if (l.content.includes('diagram:0')) continue;

  const caption = l.diagrams[0].caption || 'Diagramme';
  const ref = `\n\n![${caption}](diagram:0)\n`;

  // Insert before the 2nd ## heading if it exists, else before the 3rd paragraph
  const secondH2 = l.content.indexOf('\n## ', l.content.indexOf('\n## ') + 4);
  if (secondH2 !== -1) {
    l.content = l.content.slice(0, secondH2) + ref + l.content.slice(secondH2);
  } else {
    // Fallback: insert after the first paragraph (first double newline after content start)
    const firstBreak = l.content.indexOf('\n\n');
    if (firstBreak !== -1) {
      l.content = l.content.slice(0, firstBreak + 2) + ref.trim() + '\n\n' + l.content.slice(firstBreak + 2);
    }
  }

  fs.writeFileSync(path.join(V2, file), JSON.stringify(l, null, 2), 'utf8');
  console.log('  fixed ' + file);
  fixed++;
}

console.log('\n' + fixed + ' files updated.');
