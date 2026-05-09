const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, 'lessons-v2');

// ch04-l2: answer has double-quotes around "Routing configuration" which break the tokenizer
let l = JSON.parse(fs.readFileSync(path.join(V2, 'ch04-l2.json'), 'utf8'));
for (const q of l.questionPool) {
  if (q.choices[q.answer] && q.choices[q.answer].includes('"Routing configuration"')) {
    q.choices[q.answer] = q.choices[q.answer].replace('"Routing configuration"', 'Routing configuration');
    console.log('fixed ch04-l2 answer (removed quotes)');
  }
}
fs.writeFileSync(path.join(V2, 'ch04-l2.json'), JSON.stringify(l, null, 2), 'utf8');

// ch05-l1: answer uses "réseau" which is not in content — use "adresse IP" instead
l = JSON.parse(fs.readFileSync(path.join(V2, 'ch05-l1.json'), 'utf8'));
for (const q of l.questionPool) {
  if (q.choices[q.answer] === 'Un appareil réseau sur le réseau') {
    q.choices[q.answer] = 'Un appareil identifié par son adresse IP';
    console.log('fixed ch05-l1 Q0 answer');
  }
}
fs.writeFileSync(path.join(V2, 'ch05-l1.json'), JSON.stringify(l, null, 2), 'utf8');

console.log('done');
