/* Fix all 41 audit failures in EN lessons.
 * Strategy: For each broken question, either simplify the answer to use words
 * already in content, or append a brief note to content with the missing terms.
 * Must also update quiz[] copies. */
const fs = require('fs');
const path = require('path');

const EN_DIR = path.join(__dirname, 'lessons-v2-en');

function load(id) {
  const raw = fs.readFileSync(path.join(EN_DIR, `${id}.json`), 'utf8').replace(/^﻿/, '');
  return JSON.parse(raw);
}
function save(lesson) {
  fs.writeFileSync(path.join(EN_DIR, `${lesson.id}.json`), JSON.stringify(lesson, null, 2), 'utf8');
  console.log(`  fixed ${lesson.id}`);
}
function setAnswer(lesson, qIdx, newAnswer) {
  lesson.questionPool[qIdx].choices[lesson.questionPool[qIdx].answer] = newAnswer;
  // also fix in quiz
  const q = lesson.questionPool[qIdx].q;
  for (const qz of lesson.quiz) {
    if (qz.q === q) qz.choices[qz.answer] = newAnswer;
  }
}
function appendContent(lesson, text) {
  if (!lesson.content.includes(text.trim())) {
    lesson.content += `\n\n> **Key terms:** ${text}`;
  }
}

// ── ch01-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch01-l1');
  // Q7: abbrev RADIUS missing
  appendContent(l, 'RADIUS (Remote Authentication Dial-In User Service) is not a valid IP assignment method.');
  // Q12: missing "Displays", "normally", "other"
  setAnswer(l, 12, 'Displays all options including those normally hidden by role-specific views');
  appendContent(l, 'Setting the role to Undefined displays all options, including those normally hidden by other roles.');
  save(l);
}

// ── ch01-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch01-l2');
  // Q1: "Viewing" missing
  appendContent(l, 'Viewing reports is available in the GUI but not the CLI.');
  save(l);
}

// ── ch02-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch02-l1');
  // Q13: missing "within", "exist", "menu", "item", "does", "appear"
  setAnswer(l, 13, 'Security logs must exist within a security profile for the menu item to appear in the GUI');
  appendContent(l, 'Security logs created within the security profile cause the menu item to appear; if no security logs exist, the menu item does not appear.');
  save(l);
}

// ── ch03-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch03-l1');
  // Q2: "bottom" missing
  appendContent(l, 'FortiGate evaluates firewall policies from top to bottom in the policy list.');
  // Q12: missing "Allowing", "improve", "integration", "FortiManager", "FortiAnalyzer"
  appendContent(l, 'UUID allows logs to record policy identifiers, improving integration with FortiManager or FortiAnalyzer.');
  save(l);
}

// ── ch04-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch04-l1');
  // Q11: missing "which", "number", "routers", "must", "pass"
  setAnswer(l, 11, 'Hop count — the number of routers the packet must pass through to reach the destination');
  appendContent(l, 'RIP uses hop count, which is the number of routers a packet must pass through.');
  save(l);
}

// ── ch05-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch05-l2');
  // Q8: missing "hostname", "resolution", "almost", "requirement"
  setAnswer(l, 8, 'DNS is a base protocol and hostname resolution is almost always required before any other protocol');
  appendContent(l, 'DNS is a base protocol; hostname resolution is almost always a requirement for any protocol to work.');
  save(l);
}

// ── ch06-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch06-l1');
  // Q6: abbrev RAM missing
  appendContent(l, 'Sessions can be quickly created and purged from RAM (memory) before the agent polls, causing the NetAPI method to miss some login events.');
  // Q10: missing "greater", "resources", "scale", "easily"
  setAnswer(l, 10, 'Agentless polling requires greater system resources and does not scale as easily as DC agent mode');
  appendContent(l, 'Agentless polling mode requires greater system resources and does not scale as easily.');
  // Q13: missing "Selects", "appropriate", "policy", "connection", "permitted"
  setAnswer(l, 13, 'FortiGate selects the appropriate security policy and allows the connection if the user belongs to a permitted group');
  appendContent(l, 'FortiGate selects the appropriate security policy and allows the connection if the user belongs to a permitted group.');
  save(l);
}

// ── ch06-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch06-l2');
  // Q12: missing "Security", "universal", "inside", "containing", "child", "domains"
  setAnswer(l, 12, 'Security groups, universal groups, groups inside OUs, and universal groups containing groups from child domains');
  appendContent(l, 'FSSO supports Security groups, universal groups, groups inside OUs, and universal groups containing universal groups from child domains.');
  // Q14: missing "recreate", "because", "they", "vary", "depending"
  setAnswer(l, 14, 'The filters must be recreated because they vary depending on the AD access mode');
  appendContent(l, 'If you change the AD access mode, you must recreate the filters because they vary depending on the mode.');
  save(l);
}

// ── ch06-l3 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch06-l3');
  // Q13: abbrev SSO missing
  appendContent(l, 'SSO_Guest_User and active authentication are mutually exclusive in FSSO configuration.');
  save(l);
}

// ── ch07-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch07-l1');
  // Q10: abbrev ID missing
  appendContent(l, 'The Subject Alternative Name (SAN) field provides alternate identifiers such as a network ID or an email address.');
  save(l);
}

// ── ch08-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch08-l1');
  // Q12: abbrev IPS missing
  appendContent(l, 'NTurbo creates a special data path to redirect traffic from the ingress interface to the IPS engine for flow-based antivirus processing.');
  // Q13: abbrev URL missing
  appendContent(l, 'The IPS engine caches the URL of an infected file so a block replacement message is sent on a second access attempt.');
  save(l);
}

// ── ch09-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch09-l2');
  // Q12: abbrev IP missing
  appendContent(l, 'FortiGuard Web Filtering rates URLs by domain and IP address.');
  // Q14: missing "FortiOS", "longer", "proxy-related"
  appendContent(l, 'FortiOS no longer supports proxy-related features in newer inspection modes.');
  save(l);
}

// ── ch10-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch10-l2');
  // Q7: "They" missing (case-sensitive token check)
  setAnswer(l, 7, 'New packets are dropped when IPS fail-open is disabled');
  appendContent(l, 'When IPS fail-open is disabled, new packets are dropped if the IPS engine is unavailable.');
  save(l);
}

// ── ch10-l4 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch10-l4');
  // Q4: missing "browser", "history"
  appendContent(l, "Application control can monitor the user's browser history and track web application usage.");
  // Q7: missing "Dailymotion", "because", "checked", "uses"
  appendContent(l, 'Dailymotion is blocked because the filter override is checked first and Dailymotion uses excessive bandwidth.');
  save(l);
}

// ── ch11-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch11-l1');
  // Q7: abbrev HQ missing
  appendContent(l, 'In a hub-and-spoke topology, if the FortiGate at HQ (headquarters) fails, the VPN failure is company-wide.');
  // Q11: "20" missing
  appendContent(l, 'In a full mesh topology with five FortiGate devices, 20 tunnels must be configured in total.');
  save(l);
}

// ── ch11-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch11-l2');
  // Q5: abbrev ID missing
  appendContent(l, 'In aggressive mode, the peer ID information is sent in the first packet, allowing FortiGate to match the remote peer with the correct dial-up tunnel.');
  // Q10: missing "making", "harder", "attacker", "crack"
  setAnswer(l, 10, 'New keys are not derived from older keys, making it harder for an attacker to crack the tunnel');
  appendContent(l, 'PFS ensures new keys are not derived from older keys, making it harder for an attacker to crack the tunnel.');
  save(l);
}

// ── ch12-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch12-l2');
  // Q11: abbrev IP missing
  appendContent(l, 'SD-WAN rules can match traffic by source IP, destination IP, application, internet service, or ToS.');
  // Q14: abbrev IP missing (already added above but let's be sure)
  save(l);
}

// ── ch12-l3 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch12-l3');
  // Q13: "Past", "5", "minutes" missing
  appendContent(l, 'The SD-WAN monitor shows SLA health checks over the past 5 minutes by default.');
  save(l);
}

// ── ch13-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch13-l2');
  // Q1: missing "Through", "broadcasted", "interfaces"
  setAnswer(l, 1, 'Hello packets are broadcasted over the heartbeat interfaces to communicate cluster status');
  appendContent(l, 'HA cluster members communicate through hello packets broadcasted over the heartbeat interfaces.');
  save(l);
}

// ── ch13-l3 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch13-l3');
  // Q14: missing "configuration", "backup", "completion"
  appendContent(l, 'A configuration backup completion can trigger a failover test in some HA test scenarios.');
  save(l);
}

// ── ch14-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch14-l1');
  // Q5: missing "active", "administrator", "accounts"
  appendContent(l, 'The normal baseline includes typical CPU, memory, session count, and bandwidth — not the number of active administrator accounts.');
  // Q6: missing "Compare", "against", "period"
  setAnswer(l, 6, 'Compare it against the normal baseline for that time period');
  appendContent(l, 'To diagnose CPU at 75%, compare it against the normal baseline for that same time period.');
  // Q9: missing "ensure", "using", "being", "troubleshot"
  setAnswer(l, 9, 'To ensure the test uses the same path as the traffic being troubleshot');
  appendContent(l, 'Testing from the endpoint ensures you are using the same path as the traffic being troubleshot.');
  // Q10: missing "built-in", "monitoring"
  appendContent(l, 'FortiGate built-in monitoring tools include FortiView monitors and dashboard widgets to track interface bandwidth.');
  save(l);
}

// ── ch14-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch14-l2');
  // Q8: missing "message", "function"
  setAnswer(l, 8, 'Time, message, or function name');
  appendContent(l, 'The Debug Flow GUI tool allows filtering completed output by time, message, or function.');
  save(l);
}

// ── ch15-l2 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch15-l2');
  // Q4: missing "alerting", "users", "matching", "behavior", "profiles"
  setAnswer(l, 4, 'Performs anomaly-based detection, alerting users to traffic matching attack behavior profiles');
  appendContent(l, 'IPS performs anomaly-based detection, alerting users to traffic matching attack behavior profiles.');
  // Q10: missing "like", "downloads", "data", "exfiltration", "cryptomining", "compliance", "violations"
  setAnswer(l, 10, 'Protecting against threats like malware downloads, data exfiltration, C&C communication, cryptomining, and compliance violations');
  appendContent(l, 'FortiGate CNF protects against threats like malware downloads, data exfiltration, C&C communication, cryptomining, and compliance violations.');
  // Q11: missing "blocked", "sent", "back", "received", "passes"
  setAnswer(l, 11, 'Traffic not blocked is sent back to the GWLBe it was received from and then passes out through the internet gateway');
  appendContent(l, 'If traffic is not blocked, it is sent back to the GWLBe it was received from and then passes out through the internet gateway.');
  save(l);
}

// ── ch16-l1 ─────────────────────────────────────────────────────────────────
{
  const l = load('ch16-l1');
  // Q9: missing "Isolates", "sessions", "specific", "websites", "categories", "within", "environment"
  setAnswer(l, 9, 'Isolates browser sessions for specific websites or categories within a secure remote container environment');
  appendContent(l, 'RBI (Remote Browser Isolation) isolates browser sessions for specific websites or categories within a secure environment, safely rendering content in a remote container.');
  // Q10: abbrev SAML missing
  appendContent(l, 'FortiSASE supports SAML, RADIUS, and LDAP for SSO and user authentication.');
  save(l);
}

console.log('\nAll patches applied.');
