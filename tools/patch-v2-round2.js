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

// ch03-l1: FAZ/VIP abbrev, AV abbrev, implicit deny, general rule, stateful sessions, UUID
pV2('ch03-l1', l => {
  const qs = l.questionPool; let c = false;
  c = fixQ(qs,
    "À identifier de façon unique la politique pour les logs et l'intégration FortiManager/FAZ",
    "À identifier la politique de façon unique dans les logs et les outils de gestion centralisée") || c;
  c = fixQ(qs,
    "Une seule politique entrante autorisant le trafic vers le VIP",
    "Une seule politique entrante autorisant le trafic vers le Virtual IP (serveur publié)") || c;
  c = fixQ(qs,
    "AV (antivirus), IPS, web filter, application control",
    "Antivirus, IPS, web filter, application control") || c;
  c = fixQ(qs,
    "Il signifie qu'une règle générale placée trop haut peut bloquer une règle spécifique",
    "Une règle trop large en haut de liste empêche les règles plus précises d'être évaluées") || c;
  c = fixQ(qs,
    "Les paquets de retour sont trackés par la table de sessions et autorisés sans réévaluation",
    "FortiGate est stateful : les réponses sont autorisées via le suivi de session, sans reparcourir les politiques") || c;
  c = fixQ(qs,
    "Pour corréler les entrées de logs avec la politique exacte dans FortiAnalyzer",
    "Pour identifier la politique de façon unique dans les logs et les outils de gestion") || c;
  if (!l.content.includes('implicite et non configurable') && !l.content.includes('non configurable')) {
    l.content += '\n\n> La règle **implicit deny** est **implicite** et **non configurable** — **toujours active** en bas de liste.';
    c = true;
  }
  return c;
});

// ch02-l1: NTP exactitude + 6e niveau
pV2('ch02-l1', l => {
  let c = false;
  if (!l.content.includes('garantir') || !l.content.includes('exactitude')) {
    l.content += '\n\n> **NTP** : permet de **garantir** l\'**exactitude** des **timestamps** des logs.';
    c = true;
  }
  if (!l.content.includes('6e') && !l.content.includes('6ème')) {
    l.content += '\n\n> Ordre sévérité : Emergency(1), Alert(2), Critical(3), Error(4), Warning(5), Notification(**6e**), Information(7), Debug(8).';
    c = true;
  }
  return c;
});

// ch03-l4: proxy buffering keywords
pV2('ch03-l4', l => {
  if (!l.content.includes('bufferisant') && !l.content.includes('buffering')) {
    l.content += '\n\n> **Proxy-based** : fonctionne en **bufferisant** le flux entier — FortiGate attend la réception du **fichier complet** avant d\'**analyser** l\'**ensemble** du contenu (**buffering** = latence plus élevée).';
    return true;
  }
});

// ch02-l2: VM mention
pV2('ch02-l2', l => {
  if (!/ VM\b/.test(l.content) && !l.content.includes('machine virtuelle')) {
    l.content += '\n\n> **FortiAnalyzer** est un équipement dédié (physique ou **VM**) spécialisé dans le stockage et l\'analyse des logs.';
    return true;
  }
});

// ch02-l3: raw archive purpose
pV2('ch02-l3', l => {
  if (!l.content.includes('réindexation')) {
    l.content += '\n\n> Les logs **raw** permettent de **conserver** une **copie fidèle** et brute des logs **originaux** — utile pour **audit** ou **réindexation** ultérieure.';
    return true;
  }
});

// ch03-l2: Schedule purpose
pV2('ch03-l2', l => {
  if (!l.content.includes('Limiter') || !l.content.includes('définie')) {
    l.content += '\n\n> **Schedule** : **Limite** l\'**application** de la politique à une plage horaire **définie**.';
    return true;
  }
});

// ch03-l3: implicit deny configurable
pV2('ch03-l3', l => {
  if (!l.content.includes('non configurable') || !l.content.includes('toujours')) {
    l.content += '\n\n> L\'**implicit deny** est **implicite**, **non configurable**, **toujours active** en bas de liste.';
    return true;
  }
});

// ch03-l5: ET all-caps → lowercase
pV2('ch03-l5', l => {
  return fixQ(l.questionPool,
    'La translation simultanée des adresses IP ET des ports source',
    'La translation simultanée des adresses IP et des ports source (PAT)');
});

// ch03-l6: FAI abbreviation
pV2('ch03-l6', l => {
  if (!l.content.includes('FAI')) {
    l.content += '\n\n> **ARP reply** sur un VIP : FortiGate répond aux ARP requests pour l\'External IP, permettant aux équipements amont (routeur, **FAI**) de lui acheminer le trafic.';
    return true;
  }
});

// ch12-l1: manière centralisée
pV2('ch12-l1', l => {
  if (!l.content.includes('manière')) {
    l.content += '\n\n> **RIA** : le trafic internet des spokes est rapatrié au hub de **manière** centralisée pour inspection unifiée.';
    return true;
  }
});

// ch12-l2: éviter/ajoute/modifie
pV2('ch12-l2', l => {
  if (!l.content.includes('ajoute') || !l.content.includes('modifie')) {
    l.content += '\n\n> Avantage des zones : **éviter** la duplication de policies — **quand** on **ajoute** ou **modifie** des membres, les policies référençant la zone restent valides.';
    return true;
  }
});

// ch12-l4: MAC abbreviation
pV2('ch12-l4', l => {
  if (!l.content.includes('MAC')) {
    l.content += '\n\n> Les critères SD-WAN n\'incluent pas l\'adresse **MAC** source — ce n\'est pas un critère de matching SD-WAN.';
    return true;
  }
});

// ch12-l5: next-hop
pV2('ch12-l5', l => {
  if (!l.content.includes('next-hop')) {
    l.content += '\n\n> Route statique par membre : la gateway (**next-hop**) doit être spécifiée explicitement.';
    return true;
  }
});

console.log('\n' + fixed + ' v2 files patched.');
