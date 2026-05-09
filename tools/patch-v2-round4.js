const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, 'lessons-v2');
let fixed = 0;

function pV2(id, fn) {
  const file = path.join(V2, id + '.json');
  if (!fs.existsSync(file)) { console.warn('SKIP ' + id); return; }
  const l = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (fn(l)) { fs.writeFileSync(file, JSON.stringify(l, null, 2), 'utf8'); console.log('  patched ' + id); fixed++; }
}

function fixQ(qs, oldAns, newAns) {
  for (const q of qs) {
    if (q.choices[q.answer] === oldAns) { q.choices[q.answer] = newAns; return true; }
  }
  return false;
}

// ch08-l1: oversized action — "l'action, selon, configuration" missing
pV2('ch08-l1', l => {
  let c = false;
  c = fixQ(l.questionPool,
    "Il applique l'action pass ou block selon la configuration",
    "Le fichier est passé ou bloqué selon la configuration de l'oversized limit") || c;
  if (!l.content.includes('configuration')) {
    l.content += '\n\n> L\'**oversized limit** : selon la **configuration** du profil AV, le fichier trop volumineux est **passé** (pass) ou **bloqué** (block).';
    c = true;
  }
  return c;
});

// ch08-l4: archive chiffrée — "decompresser, analyser" missing
pV2('ch08-l4', l => {
  let c = false;
  c = fixQ(l.questionPool,
    "Parce qu'il ne peut pas les decompresser pour les analyser",
    "FortiGate ne peut pas décompresser les archives chiffrées pour analyser le contenu") || c;
  if (!l.content.includes('décompresser') && !l.content.includes('decompresser')) {
    l.content += '\n\n> Archives **chiffrées** : FortiGate ne peut pas les **décompresser** pour **analyser** le contenu — action configurable : bloquer ou passer.';
    c = true;
  }
  return c;
});

// ch11-l5: intégrité — long answer with tokens not in content
pV2('ch11-l5', l => {
  let c = false;
  c = fixQ(l.questionPool,
    "Garantir l'intégrité des paquets IPsec — vérifier qu'ils n'ont pas été modifiés en transit",
    "Assurer l'intégrité des paquets et détecter toute modification pendant le transport") || c;
  if (!l.content.includes('intégrité') && !l.content.includes('integrite')) {
    l.content += "\n\n> L'**intégrité** des paquets IPsec est vérifiée par l'algorithme HMAC — toute modification des données en transit est détectée.";
    c = true;
  }
  return c;
});

// ch14-l1: single-quotes break tokenizer + "fonctionnent correctement"
pV2('ch14-l1', l => {
  let c = false;
  // Remove single-quotes from answer that wraps command name
  c = fixQ(l.questionPool,
    "Le serial number et le modèle fournis par 'get system status'",
    "Le serial number et le modèle du FortiGate") || c;
  c = fixQ(l.questionPool,
    "Que les interfaces fonctionnent correctement sans collisions ni erreurs de transmission",
    "Aucune erreur réseau, collisions ou paquets droppés sur les interfaces") || c;
  if (!l.content.includes('collisions') || !l.content.includes('erreurs')) {
    l.content += '\n\n> Indicateurs baseline : CPU < 80%, mémoire libre > 30%, **aucune erreur** réseau ni **collisions** sur les interfaces (visibles via `get hardware nic`).';
    c = true;
  }
  return c;
});

// ch14-l5: "bloquées, arrêtées" missing
pV2('ch14-l5', l => {
  let c = false;
  c = fixQ(l.questionPool,
    "Les nouvelles sessions sont bloquées et arrêtées",
    "Les nouvelles sessions sont refusées — seuil extreme threshold atteint") || c;
  if (!l.content.includes('refusées') && !l.content.includes('bloquées')) {
    l.content += '\n\n> Seuil **extreme threshold** (< 5% mémoire libre) : les nouvelles sessions sont **refusées** et **bloquées** — le FortiGate protège sa stabilité.';
    c = true;
  }
  return c;
});

// ch15-l3: HA missing + "flexibilité" wording
pV2('ch15-l3', l => {
  let c = false;
  if (!l.content.includes('HA')) {
    l.content += '\n\n> Avantage CNF vs FortiGate VM : pas de gestion de **HA** (High Availability), de patching, ni de scaling — tout est géré par Fortinet.';
    c = true;
  }
  c = fixQ(l.questionPool,
    "Moins de flexibilité — certaines fonctionnalités FortiOS avancées ne sont pas disponibles",
    "Certaines fonctionnalités FortiOS avancées ne sont pas disponibles dans CNF") || c;
  return c;
});

// ch15-l4: "Quand on a besoin de fonctionnalités FortiOS avancées..."
pV2('ch15-l4', l => {
  let c = false;
  c = fixQ(l.questionPool,
    "Quand on a besoin de fonctionnalités FortiOS avancées ou d'une grande flexibilité de configuration",
    "Quand des fonctionnalités FortiOS avancées ou une grande flexibilité de configuration sont nécessaires") || c;
  if (!l.content.includes('fonctionnalités FortiOS avancées') && !l.content.includes('flexibilité')) {
    l.content += "\n\n> FortiGate VM vs CNF : préférer FortiGate VM quand des **fonctionnalités FortiOS avancées** ou une grande **flexibilité** de **configuration** sont nécessaires.";
    c = true;
  }
  return c;
});

console.log('\n' + fixed + ' v2 files patched.');
