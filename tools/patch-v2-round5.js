const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, 'lessons-v2');

// ch16-l1: long answer with tokens not in content — simplify
const l = JSON.parse(fs.readFileSync(path.join(V2, 'ch16-l1.json'), 'utf8'));
for (const q of l.questionPool) {
  const a = q.choices[q.answer] || '';
  if (a.includes('travaillant') || a.includes('endroits varies')) {
    q.choices[q.answer] = 'Les employés accèdent aux applications depuis le bureau et en télétravail depuis des emplacements variés';
    console.log('fixed ch16-l1 answer');
  }
}
if (!l.content.includes('emplacements') && !l.content.includes('télétravail')) {
  l.content += "\n\n> **Travail hybride** : les employés accèdent aux applications depuis le **bureau** ou en **télétravail**, depuis des **emplacements** variés — bureau, domicile, déplacements.";
}
fs.writeFileSync(path.join(V2, 'ch16-l1.json'), JSON.stringify(l, null, 2), 'utf8');
console.log('done');
