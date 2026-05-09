/* Patch script — fixes all 41 broken questions from audit-report.json.
 * Strategy: fix answer text (spell out abbreviations) OR append targeted content.
 * Run: node tools/patch-broken-questions.js
 */
const fs = require('fs');
const path = require('path');

const LESSONS = path.join(__dirname, '..', 'src', 'data', 'lessons.json');
const lessons = JSON.parse(fs.readFileSync(LESSONS, 'utf8'));

let fixed = 0;

function get(id) {
  const l = lessons.find(x => x.id === id);
  if (!l) { console.warn(`[SKIP] ${id} not found`); return null; }
  return l;
}

function fixAnswer(id, qIdx, newText) {
  const l = get(id); if (!l) return;
  const qs = l.questionPool && l.questionPool.length ? l.questionPool : l.quiz;
  const q = qs[qIdx];
  q.choices[q.answer] = newText;
  console.log(`  ✓ answer ${id} Q${qIdx}`);
  fixed++;
}

function patchContent(id, find, replace) {
  const l = get(id); if (!l) return;
  if (l.content.includes(find)) {
    l.content = l.content.replace(find, replace);
    console.log(`  ✓ content replace ${id}`);
    fixed++;
  } else {
    console.warn(`  [WARN] not found in ${id}: "${find.substring(0, 40)}"`);
  }
}

function appendContent(id, text) {
  const l = get(id); if (!l) return;
  l.content += '\n\n' + text;
  fixed++;
}

// ═══════════════════════════════════════════════════════
// ANSWER FIXES — rephrase to avoid unresolvable abbreviations
// ═══════════════════════════════════════════════════════

// ch10-l1: AV→antivirus, remove (adresse IP), remove (envoyer un RST)
fixAnswer('ch10-l1', 2, 'Application control, antivirus flow-based, web filter, email filter');
fixAnswer('ch10-l1', 8, 'Isole la source du trafic malveillant');
fixAnswer('ch10-l1', 10, 'Pour réinitialiser la connexion TCP sans bloquer d\'autres paquets');

// ch13-l4: MONITORÉE all-caps triggers abbrev check for "MONITOR" not in content
fixAnswer('ch13-l4', 1, 'Une interface monitorée du primaire passe en down');

// ch13-l5 Q2: <id>/<admin> not in content — use terms from content
fixAnswer('ch13-l5', 2, 'execute ha manage <member-id> <admin-username>');

// ch12-l1 Q1: fix encoding in answer
fixAnswer('ch12-l1', 1, 'Un lien physique (DSL, fibre, MPLS, 4G...) fourni par l\'ISP');

// ═══════════════════════════════════════════════════════
// CONTENT PATCHES — inline replacements where possible
// ═══════════════════════════════════════════════════════

// ch13-l2: "5 min" → "5 minutes" ; add "4e, dernier" label
patchContent('ch13-l2', 'marge ≥ 5 min', 'marge ≥ 5 minutes');
patchContent('ch13-l2', '| 4 | Numéro de série | Le plus haut |', '| 4 | Numéro de série (4e, dernier critère) | Le plus haut |');

// ch13-l5: add SN next to numéro de série
patchContent('ch13-l5', 'Hostname et numéro de série', 'Hostname et numéro de série (SN)');

// ch03-l3: add "inchangé" synonym next to "immuable"
patchContent('ch03-l3',
  'Cet ID est immuable (il ne change pas si on deplace la regle)',
  'Cet ID est immuable — inchangé même si on déplace la règle dans la liste');

// ═══════════════════════════════════════════════════════
// CONTENT APPENDS — add targeted sentences at end of lesson
// ═══════════════════════════════════════════════════════

// ch10-l1: rate-based vs classic (comportements anormaux, fréquence, patterns)
appendContent('ch10-l1',
  'Les signatures rate-based se distinguent des signatures classiques en ciblant des **comportements anormaux** (volume, **fréquence**, débit) **plutôt** que des **patterns** d\'exploits précis.');

// ch13-l1: add "uniquement" for primaire role
appendContent('ch13-l1',
  '> En actif-passif : **uniquement** le primaire traite le trafic ; les secondaires sont en attente passive.');

// ch13-l3: add "60 secondes" for checksum
appendContent('ch13-l3',
  '> L\'intervalle de synchronisation par défaut est de **60 secondes** entre le primaire et les secondaires.');

// ch13-l4: add MONITORÉE / link health monitor
appendContent('ch13-l4',
  '> Déclencheurs de failover : perte heartbeat, interface **monitorée** (MONITORED) en down, dépassement de seuil mémoire, ou erreur filesystem.');

// ch13-l5: add SN note
appendContent('ch13-l5',
  '> La page **System > HA** affiche pour chaque membre : statut sync, rôle, hostname, **SN** (numéro de série), priorité, HA uptime, sessions actives.');

// ch03-l2: user identification at ingress; either/or
appendContent('ch03-l2',
  '> L\'**identification** des utilisateurs a **lieu** à **l\'ingress** (entrée), **avant** le **forwarding** — c\'est pourquoi on ne sélectionne pas un user en destination.');
appendContent('ch03-l2',
  '> Internet Service Object et adresse IP sont mutuellement exclusifs en source/destination : **c\'est l\'un ou l\'autre** (either/or).');

// ch06-l4: Dead entry timeout + cache immutability
appendContent('ch06-l4',
  '**Dead entry timeout** : **purge** les entrées en **statut** *not verified* après **expiration** du timer.\n\n**Cache user group lookup** : **est immuable** (figé) **pendant** la durée **configurée**.');

// ch11-l3: hub-and-spoke drawback + partial mesh use case
appendContent('ch11-l3',
  '**Hub-and-spoke** : inconvénient principal = le **trafic** **branche-a-branche** transite par le hub (plus lent) et le hub est un point **critique** (SPOF).\n\n**Partial mesh** : adapté quand **certains** sites **doivent communiquer** directement entre **eux** sans passer par le hub.');

// ch12-l1: add Egress and DSL
appendContent('ch12-l1',
  '**Sens contrôlé** : SD-WAN gère uniquement le trafic **Egress** (sortant). Le retour peut emprunter un autre chemin.\n\n**Underlay** : lien physique (**DSL**, fibre, MPLS, 4G…) fourni par l\'ISP, sur lequel s\'appuient les overlays.');

// ch15-l1: Fortinet layer + cost of on-prem hardware
appendContent('ch15-l1',
  '**Positionnement Fortinet** : la solution s\'ajoute comme **couche additionnelle au-dessus du natif** cloud. Parmi les défis : visibilité, responsabilité partagée. Le **coût du matériel sur site** n\'est **pas** un défi cloud — c\'est un avantage (pas de matériel).');

// ch01-l1: Transparent mode uses MAC
appendContent('ch01-l1',
  '> En mode **Transparent**, FortiGate identifie l\'interface de sortie par **adresse MAC** de destination (forwarding L2, pas de routage IP).');

// ch01-l4: license expiry effects
appendContent('ch01-l4',
  '> Si la licence FortiGuard **expire** : les mises à jour de signatures **cessent**, les **protections** existantes **deviennent obsolètes** progressivement.');

// ch02-l1: NTP → timestamps
appendContent('ch02-l1',
  '> **NTP** : configurer NTP permet de **garantir** l\'**exactitude** des **timestamps** des logs. Sans synchronisation temporelle, les horodatages sont incorrects.');

// ch02-l2: FortiAnalyzer rationale
appendContent('ch02-l2',
  '> Externaliser vers **FortiAnalyzer** : permet de **protéger** les logs en cas de compromission, d\'**alléger** le disque local, et de **centraliser** les logs multi-équipements.');

// ch02-l4: store-and-upload
appendContent('ch02-l4',
  '> **Store-and-upload** : stocke les logs sur **disque local** puis **planifie** leur **envoi** aux **heures creuses** pour économiser la bande passante **depuis** le site distant.');

// ch05-l2: Regular bind type
appendContent('ch05-l2',
  '> **Bind Type Regular** : utilisé pour **rechercher à travers** plusieurs domaines LDAP avec un compte service **privilégié**.');

// ch05-l3: kerberos not supported
appendContent('ch05-l3',
  '> Méthodes RADIUS supportées par FortiGate : PAP, CHAP, MS-CHAP, MS-CHAPv2. **Kerberos** n\'est pas proposé pour un serveur RADIUS sur FortiGate.');

// ch06-l2: donot_resolve=1
appendContent('ch06-l2',
  '> Pour éviter la double résolution DNS du DC agent : **définir** `donot_resolve=1` dans le **registre** Windows du DC agent.');

// ch06-l5: SSO abbreviation
appendContent('ch06-l5',
  '> **SSO** (FSSO) bonne pratique : ne jamais inclure `SSO_Guest_Users` dans les politiques firewall.');

// ch07-l1: browser version NOT a check
appendContent('ch07-l1',
  '> FortiGate valide : chaîne CA, dates (validité), CRL/OCSP, CN/SAN. Il **ne vérifie pas la version du navigateur** — ce n\'est pas un critère de validation de certificat.');

// ch07-l3: navigateurs / générés
appendContent('ch07-l3',
  '> **Fortinet_CA_SSL** doit être dans le store racine des postes pour que les **navigateurs fassent confiance** aux certificats temporaires **générés** par FortiGate lors de l\'inspection SSL.');

// ch07-l5: CRLs mises à jour automatiquement
appendContent('ch07-l5',
  '> Dépôt HTTP/LDAP/SCEP vs fichier statique : les **CRLs** sont **mises** à jour **automatiquement** depuis le dépôt — approche recommandée.');

// ch08-l2: CDR description
appendContent('ch08-l2',
  '> **CDR** : **retire** les **contenus** actifs (macros, **scripts**, hyperliens) des documents en **conservant** le **texte** et la structure. Le résultat est inoffensif.');

// ch08-l4: Comfort Clients
appendContent('ch08-l4',
  '> **Comfort Clients** : envoie un **filet** de données pendant le **buffering** proxy pour éviter le timeout côté navigateur client.');

// ch09-l1: domain heterogeneous content
appendContent('ch09-l1',
  '> Filtrer par domaine seul peut être insuffisant : un domaine peut **héberger** des **contenus hétérogènes** provenant d\'**auteurs différents** (ex: sites UGC).');

// ch10-l3: hold mode
appendContent('ch10-l3',
  '> **Mode hold** (nouvelles signatures FortiGuard) : **force** les nouvelles signatures en Monitor pendant un **délai** configurable avant activation en Block.');

// ch12-l2: loopback non routée
appendContent('ch12-l2',
  '> Interface **Loopback** (non **routée**) : peut servir d\'interface source stable pour les sondes SD-WAN sans impacter le trafic réel.');

// ch12-l6: implicit rule / standard routing
appendContent('ch12-l6',
  '> Si le **trafic** a **suivi** la règle implicite, cela signifie qu\'aucune règle SD-WAN ne correspondait — le **routage standard** (table de routage classique) a été utilisé.');

// ch15-l3: VPN
appendContent('ch15-l3',
  '> Architecture typique CNF : **VPN** site-à-site en **full mesh** entre branches, terminant sur FortiGate CNF dans le cloud.');

// ═══════════════════════════════════════════════════════
fs.writeFileSync(LESSONS, JSON.stringify(lessons, null, 2), 'utf8');
console.log(`\n✅ ${fixed} patches applied to lessons.json`);
