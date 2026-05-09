const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, 'lessons-v2');

// ch11-l5: answer tokens not in content — use simpler wording matching content
const l = JSON.parse(fs.readFileSync(path.join(V2, 'ch11-l5.json'), 'utf8'));
for (const q of l.questionPool) {
  if (q.choices[q.answer] && q.choices[q.answer].includes("l'intégrité des paquets")) {
    q.choices[q.answer] = "Garantir que les données IPsec ne sont pas modifiées pendant le transit";
    console.log('fixed ch11-l5 answer');
  }
}
// Add plain-text sentence with matching keywords
if (!l.content.includes('garantir') && !l.content.includes('Garantir')) {
  l.content += "\n\n> Phase 2 permet de **garantir** que les données IPsec ne sont pas **modifiées** pendant le **transit** — grâce à l'intégrité HMAC, toute altération est détectée.";
  console.log('appended ch11-l5 content');
}
fs.writeFileSync(path.join(V2, 'ch11-l5.json'), JSON.stringify(l, null, 2), 'utf8');
console.log('done');
