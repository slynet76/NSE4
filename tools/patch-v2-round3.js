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

// ch04-l1: Q12 bad wording (FGT sends TO FortiGuard reversed), Q14 ET→et
pV2('ch04-l1', l => {
  let c = false;
  c = fixQ(l.questionPool,
    'Le FortiGate envoyant des mises à jour de signatures à FortiGuard',
    'Le FortiGate téléchargeant des mises à jour de signatures depuis FortiGuard') || c;
  c = fixQ(l.questionPool,
    "Pour trouver la route de l'initiateur ET la route de retour du répondeur",
    "Pour trouver la route de l'initiateur et la route de retour du répondeur") || c;
  if (!l.content.includes('mises à jour de signatures')) {
    l.content += '\n\n> **Local-out traffic** : trafic initié par le FortiGate lui-même — requêtes DNS, mises à jour de signatures FortiGuard, NTP, SNMP, logs vers FortiAnalyzer.';
    c = true;
  }
  return c;
});

// ch04-l2: "Routing configuration" option + 10.0.1.0/24 example
pV2('ch04-l2', l => {
  let c = false;
  if (!l.content.includes('Routing configuration')) {
    l.content += '\n\n> Option **"Routing configuration"** : doit être activée sur un objet adresse firewall pour pouvoir l\'utiliser comme destination dans une route statique.';
    c = true;
  }
  if (!l.content.includes('10.0.1.0')) {
    l.content += '\n\n> Exemple : assigner l\'IP 10.0.1.1/24 à port2 crée automatiquement une route **connected** vers **10.0.1.0/24 via port2**.';
    c = true;
  }
  return c;
});

// ch04-l3: ECMP abbrev, ET→et, "directly connected" wording, "valeur la plus basse"
pV2('ch04-l3', l => {
  let c = false;
  c = fixQ(l.questionPool,
    'Quand elles ont la même distance ET la même metric',
    'Quand elles ont la même distance et la même metric') || c;
  c = fixQ(l.questionPool,
    'Car les routes directly connected doivent toujours être préférées, sans exception possible',
    'Car la distance des routes connected est hardcoded à 0 et ne peut pas être modifiée') || c;
  if (!l.content.includes('ECMP')) {
    l.content += '\n\n> **ECMP** (Equal-Cost Multi-Path) : quand plusieurs routes ont la même distance et la même metric, elles sont toutes installées dans la FIB. Le paramètre **priority** les différencie pour l\'ECMP.';
    c = true;
  }
  if (!l.content.includes('valeur la plus basse')) {
    l.content += '\n\n> Règle générale : la **valeur la plus basse** l\'emporte (distance, metric, priority) — chaque tiebreaker est comparé dans cet ordre.';
    c = true;
  }
  return c;
});

// ch05-l1: "device", facteurs 2FA, "champ source"
pV2('ch05-l1', l => {
  let c = false;
  c = fixQ(l.questionPool,
    'Un appareil (device)',
    'Un appareil réseau sur le réseau') || c;
  if (!l.content.includes('connaissez') || !l.content.includes('possédez')) {
    l.content += '\n\n> **Facteurs 2FA** : quelque chose que vous **connaissez** (mot de passe) + quelque chose que vous **possédez** (token, FortiToken, OTP).';
    c = true;
  }
  if (!l.content.includes('champ source')) {
    l.content += '\n\n> Les utilisateurs et groupes à authentifier sont configurés dans le **champ source** d\'une politique firewall.';
    c = true;
  }
  return c;
});

// ch05-l2: plaintext in content, fix Q13 with generic placeholder
pV2('ch05-l2', l => {
  let c = false;
  if (!l.content.includes('plaintext')) {
    l.content += '\n\n> LDAP port 389 transmet les identifiants en **clair** (**plaintext**) — utiliser LDAPS (port 636) pour chiffrer avec TLS.';
    c = true;
  }
  c = fixQ(l.questionPool,
    'diagnose test authserver ldap server1 user1 pass1',
    'diagnose test authserver ldap <nom-serveur> <utilisateur> <mot-de-passe>') || c;
  return c;
});

// ch05-l3: LDAP and AD missing
pV2('ch05-l3', l => {
  let c = false;
  if (!l.content.includes('LDAP')) {
    l.content += '\n\n> **RADIUS vs LDAP** : RADIUS est un protocole AAA — LDAP est un protocole d\'accès à un annuaire. Ce sont deux protocoles distincts avec des rôles différents.';
    c = true;
  }
  if (!/\bAD\b/.test(l.content)) {
    l.content += '\n\n> **Kerberos** n\'est pas supporté comme méthode RADIUS sur FortiGate — c\'est un protocole d\'authentification propre aux environnements Windows/**AD** (Active Directory).';
    c = true;
  }
  return c;
});

// ch11-l1: "LANs distants"
pV2('ch11-l1', l => {
  if (!l.content.includes('distants') || !l.content.includes('LAN')) {
    l.content += '\n\n> VPN **site-to-site** : connecte deux **LANs distants** via Internet — les utilisateurs des deux sites accèdent aux ressources comme s\'ils étaient sur le même réseau local.';
    return true;
  }
});

// ch11-l2: "requiert" + "établir"
pV2('ch11-l2', l => {
  if (!l.content.includes('requiert') || !l.content.includes('établir')) {
    l.content += '\n\n> **IKEv2** est plus efficace : il **requiert** moins de messages pour **établir** les SAs (4 messages vs 9 pour IKEv1 en mode main).';
    return true;
  }
});

// ch11-l3: "transitant"
pV2('ch11-l3', l => {
  if (!l.content.includes('transitant')) {
    l.content += '\n\n> Hub-and-spoke : tout le trafic branche-à-branche circule en **transitant** par le hub — latence additionnelle et hub = SPOF (Single Point of Failure).';
    return true;
  }
});

console.log('\n' + fixed + ' v2 files patched.');
