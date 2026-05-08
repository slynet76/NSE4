/* Audit: pour chaque leçon, vérifie si la bonne réponse de chaque quiz est trouvable dans le contenu.
 *
 * Stratégie de matching (réponse "trouvable" si au moins UNE des conditions est vraie) :
 *   1. La réponse complète (normalisée) apparaît dans le contenu (substring case-insensitive).
 *   2. Pour chaque token "significatif" (>=4 chars, hors stopwords FR/EN, ou IP/nombre/abbrev MAJ),
 *      au moins 60% des tokens significatifs sont présents dans le contenu.
 *   3. Cas spéciaux : si la réponse est une abréviation MAJ (ex "NAT","ISFW","ASIC","NP","CP"),
 *      elle doit apparaître telle quelle (case-sensitive).
 */
const fs = require('fs');
const path = require('path');

const LESSONS = path.join(__dirname, '..', 'src', 'data', 'lessons.json');
const lessons = JSON.parse(fs.readFileSync(LESSONS, 'utf8'));

const STOP = new Set([
  'le','la','les','un','une','des','de','du','et','ou','est','sont','pour','par','dans','sur','avec','sans','que','qui','quoi','quel','quelle','quels','quelles','ce','cette','ces','son','sa','ses','au','aux','en','a','y','si','ne','pas','plus','tout','tous','toute','toutes','un','une',
  'the','a','an','of','to','and','or','is','are','for','by','in','on','at','with','from','as','this','that','these','those','it','its','be','can','may','will'
]);

function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // diacritics
    .replace(/[’']/g, "'");
}

function isAbbrevMaj(s) {
  // 2+ chars all uppercase, possibly with digits/dashes
  return /^[A-Z][A-Z0-9-]+$/.test(s.trim());
}

function tokenize(s) {
  return norm(s).split(/[^a-z0-9./:-]+/).filter(Boolean);
}

function significantTokens(answer) {
  const raw = answer.split(/[\s(),;:/]+/).filter(Boolean);
  const out = [];
  for (const t of raw) {
    // IP, version, nombre
    if (/^\d/.test(t) || /\d/.test(t)) { out.push({ t, kind: 'literal' }); continue; }
    if (isAbbrevMaj(t)) { out.push({ t, kind: 'abbrev' }); continue; }
    const n = norm(t);
    if (n.length >= 4 && !STOP.has(n)) out.push({ t, kind: 'word', n });
  }
  return out;
}

function check(answer, content) {
  const ansN = norm(answer);
  const contN = norm(content);
  if (!ansN) return { ok: false, reason: 'empty answer' };

  // 1) full substring
  if (contN.includes(ansN)) return { ok: true, reason: 'full match' };

  // 3) abbreviation must appear case-sensitive
  const abbrevs = answer.split(/[^A-Za-z0-9-]+/).filter(isAbbrevMaj);
  for (const a of abbrevs) {
    if (!new RegExp(`\\b${a}\\b`).test(content)) {
      return { ok: false, reason: `abbrev "${a}" missing` };
    }
  }
  if (abbrevs.length > 0 && abbrevs.every(a => new RegExp(`\\b${a}\\b`).test(content))) {
    return { ok: true, reason: 'abbrev match' };
  }

  // 2) significant tokens — at least 60% present
  const sig = significantTokens(answer);
  if (sig.length === 0) {
    // answer too generic (e.g. "Oui", "Non", numbers only) — accept (can't audit reliably)
    return { ok: true, reason: 'too generic to audit' };
  }
  const found = sig.filter(({ t, kind, n }) => {
    if (kind === 'literal') return content.includes(t);
    if (kind === 'abbrev') return new RegExp(`\\b${t}\\b`).test(content);
    return contN.includes(n);
  });
  const ratio = found.length / sig.length;
  if (ratio >= 0.6) return { ok: true, reason: `tokens ${found.length}/${sig.length}` };
  return { ok: false, reason: `tokens ${found.length}/${sig.length} (need 60%)`, missing: sig.filter(s => !found.includes(s)).map(s => s.t) };
}

const report = [];
let totalQ = 0, brokenQ = 0;

for (const lesson of lessons) {
  const issues = [];
  for (let i = 0; i < lesson.quiz.length; i++) {
    totalQ++;
    const q = lesson.quiz[i];
    const correct = q.choices[q.answer];
    const r = check(correct, lesson.content);
    if (!r.ok) {
      brokenQ++;
      issues.push({ qIndex: i, q: q.q, correct, reason: r.reason, missing: r.missing });
    }
  }
  if (issues.length > 0) {
    report.push({
      id: lesson.id,
      module: lesson.module,
      title: lesson.title,
      brokenCount: issues.length,
      total: lesson.quiz.length,
      issues,
    });
  }
}

report.sort((a, b) => b.brokenCount - a.brokenCount);

console.log(`\n=== AUDIT ${lessons.length} leçons / ${totalQ} questions ===`);
console.log(`Questions cassées (réponse non trouvable dans la leçon) : ${brokenQ}/${totalQ} (${(brokenQ/totalQ*100).toFixed(1)}%)`);
console.log(`Leçons avec au moins 1 problème : ${report.length}/${lessons.length}`);

console.log('\n--- TOP 25 LEÇONS LES PLUS CASSÉES ---');
for (const l of report.slice(0, 25)) {
  console.log(`\n[${l.brokenCount}/${l.total}] ${l.id} — ${l.title}`);
  console.log(`  module: ${l.module}`);
  for (const iss of l.issues) {
    console.log(`  Q${iss.qIndex+1}: « ${iss.q} »`);
    console.log(`    bonne réponse: « ${iss.correct} »`);
    console.log(`    raison: ${iss.reason}${iss.missing ? ' — manque: ' + iss.missing.join(', ') : ''}`);
  }
}

fs.writeFileSync(
  path.join(__dirname, 'audit-report.json'),
  JSON.stringify({
    summary: { totalLessons: lessons.length, totalQuestions: totalQ, brokenQuestions: brokenQ, brokenLessons: report.length },
    lessons: report,
  }, null, 2),
);
console.log('\n→ Rapport JSON : tools/audit-report.json');
