import * as db from "./store.js";
import * as ai from "./ai.js";
import * as media from "./media.js";
import { SKILLS, LEVELS, DEPTH, SETTINGS, KIND, TOPICS, KNOW_COLD } from "./curriculum.js";
import { BANK_A } from "./quiz-bank-a.js";
import { BANK_B } from "./quiz-bank-b.js";
const QUIZ_BANK = { ...BANK_A, ...BANK_B };
import { LESSONS, STALL_PHRASES } from "./learn-data.js";
import { FRAMEWORKS, TYPE_FRAMEWORK, TYPE_LABEL, SPEAK_LEVELS, SPEAK_SKILLS, SPEAK_TOPICS, CURVEBALLS, EMOTIONS, TWISTERS, FILLERS } from "./speak-data.js";

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const clamp = (n, a, b) => Math.max(a, Math.min(b, Math.round(Number(n) || a)));
const z = n => String(n).padStart(2, "0");
const localDate = (d = new Date()) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return iso; } };
const daysSince = iso => (Date.now() - Date.parse(iso)) / 864e5;
const words = s => (String(s || "").trim().match(/\S+/g) || []).length;
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || db.uid("p");
const strArr = (a, n) => Array.isArray(a) ? a.filter(x => typeof x === "string" && x.trim()).slice(0, n) : [];
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const fmtSecs = s => Math.floor(s / 60) + ":" + z(Math.round(s % 60));
const orNull = t => ({ anyOf: [{ type: t }, { type: "null" }] });
const nullableInt = orNull("integer");
const strList = { type: "array", items: { type: "string" } };
const obj = (props) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });

/* ---------- State ---------- */
const S = {
  settings: { apiKey: "", model: ai.DEFAULT_MODEL, voice: "", rate: 1, voiceMode: false, about: "" },
  profile: null, plans: [], sessions: [], phrases: [], recordings: [], knowCold: {}, spend: { months: {} }, speeches: [], speak: null, learn: {}, learnFocus: null, learnOpen: null, drill2: null,
  live: null, busy: "", flash: "", view: "today", quiz: null, drill: null, lookup: null, ctl: null
};
const VIEWS = ["today", "learn", "speak", "cold", "film", "plan", "progress", "phrases", "settings"];

function defaultProfile() {
  const skills = {};
  for (const k of Object.keys(SKILLS)) skills[k] = { level: 2, up: 0, down: 0, scores: [] };
  return { id: "profile", skills, topics: {}, sessionCount: 0, createdAt: new Date().toISOString() };
}
function prof() {
  const base = S.profile || defaultProfile();
  const skills = {};
  for (const k of Object.keys(SKILLS)) skills[k] = base.skills?.[k] || { level: 2, up: 0, down: 0, scores: [] };
  return { ...base, skills, topics: base.topics || {} };
}
const currentPlan = () => S.plans[0] || null;
const learner = () => S.settings.about.trim() || "No background given. Assume an adult professional who speaks English as a second language and is learning American workplace small talk.";
const lvName = n => LEVELS[clamp(n, 1, 6) - 1].name;

async function loadAll() {
  const [kv, plans, sessions, phrases, recordings, speeches] = await Promise.all([db.all("kv"), db.all("plans"), db.all("sessions"), db.all("phrases"), db.all("recordings"), db.all("speeches")]);
  const kvm = Object.fromEntries(kv.map(r => [r.id, r.value]));
  S.settings = { ...S.settings, ...(kvm.settings || {}), apiKey: kvm.apiKey || "" };
  S.profile = kvm.profile || null;
  S.knowCold = kvm.knowCold || {};
  S.spend = kvm.spend || { months: {} };
  S.learn = kvm.learn || {}; S.learnFocus = kvm.learnFocus || null;
  const byNew = (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  S.speeches = speeches.sort(byNew); restoreSpeak();
  S.plans = plans.sort(byNew); S.sessions = sessions.sort(byNew); S.phrases = phrases; S.recordings = recordings.sort(byNew);
  ai.configure({ apiKey: S.settings.apiKey, modelId: S.settings.model });
  if (!S.plans.length) await seedPlan();
}
async function saveSettings() {
  const { apiKey, ...rest } = S.settings;
  await db.kvSet("settings", rest);
  await db.kvSet("apiKey", apiKey);
  ai.configure({ apiKey, modelId: S.settings.model });
}
async function saveProfile(p) { S.profile = p; await db.kvSet("profile", p); }
async function seedPlan() {
  const month = new Date().getMonth() + 1;
  const seasonal = Object.keys(TOPICS).filter(k => TOPICS[k].months.includes(month)).slice(0, 3);
  const plan = {
    id: db.uid("plan"), createdAt: new Date().toISOString(), source: "Starter plan", request: null,
    headline: "Calibration week: follow-ups and turning it back",
    focus_skills: ["follow_up", "turn_back"], topics: [...seasonal, "weekend_plans"].slice(0, 4), setting: "one_on_one",
    partner_level_override: null, override_until: null, sessions_per_week: 4, speak_per_week: 2,
    notes: [
      "Everyone starts at Level 2. A 5/5 in your first three reps moves you up right away, so the ladder finds your level fast.",
      "The goal isn't knowing the topic. It's one good question, then a second one that builds on their answer.",
      "Turn on voice mode and say your replies out loud. Speaking is the skill; typing is a fallback."
    ],
    changes: [{ change: "Starter focus on follow-ups and turning it back", why: "These two moves carry most small talk, even on topics you don't know well." }],
    week_summary: ""
  };
  await db.put("plans", plan); S.plans = [plan];
}

function fillerMarkup(text) {
  const out = [], toks = String(text).split(/(\s+)/);
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i].toLowerCase().replace(/[^a-z']/g, ""), next = (toks[i + 2] || "").toLowerCase().replace(/[^a-z']/g, "");
    if (w && next && FILLERS.includes(w + " " + next)) { out.push(h("mark", { class: "filler", text: toks[i] + toks[i + 1] + toks[i + 2] })); i += 2; continue; }
    if (w && FILLERS.includes(w)) out.push(h("mark", { class: "filler", text: toks[i] })); else out.push(toks[i]);
  }
  return out;
}

/* ---------- Spend meter ---------- */
const FEATURE_LABEL = { rep: "Conversation reps", speak: "Speaking challenges", plan: "Plan updates", quiz: "Quiz feedback", video: "Video drills", lookup: "Phrase lookups", other: "Other" };
const monthKey = (d = new Date()) => d.getFullYear() + "-" + z(d.getMonth() + 1);
ai.onUsage(({ feature, cost, searches }) => {
  const m = S.spend.months[monthKey()] ||= { total: 0, calls: 0, searches: 0, byFeature: {} };
  m.total += cost; m.calls += 1; m.searches += searches;
  m.byFeature[feature] = (m.byFeature[feature] || 0) + cost;
  db.kvSet("spend", S.spend).catch(() => {});
  renderMini();
});
const money = n => n < 0.01 ? "$" + n.toFixed(4) : "$" + n.toFixed(2);
function spendCard() {
  const m = S.spend.months[monthKey()];
  const months = Object.entries(S.spend.months).sort((a, b) => b[0].localeCompare(a[0]));
  const allTime = months.reduce((a, [, v]) => a + v.total, 0);
  return h("article", { class: "card" }, h("h3", { text: "Spend meter" }),
    h("div", { class: "stats" },
      h("div", { class: "stat" }, h("span", { class: "v num", text: money(m?.total || 0) }), h("span", { class: "k", text: "This month" })),
      h("div", { class: "stat" }, h("span", { class: "v num", text: m?.calls || 0 }), h("span", { class: "k", text: "Claude calls this month" })),
      h("div", { class: "stat" }, h("span", { class: "v num", text: money(allTime) }), h("span", { class: "k", text: "All time in this browser" }))),
    m ? h("ul", { class: "clean small num" }, Object.entries(m.byFeature).sort((a, b) => b[1] - a[1]).map(([f, c]) => h("li", { text: (FEATURE_LABEL[f] || f) + ": " + money(c) }))) : h("p", { class: "small muted", text: "Nothing spent yet this month. Quizzes from the built-in question bank are free." }),
    h("p", { class: "small muted", text: "Estimated from the token counts each reply reports, at list prices. Your Anthropic Console is the official bill." }));
}

/* ---------- Adaptive engine ---------- */
function pickTopic(plan) {
  const month = new Date().getMonth() + 1;
  let pool = strArr(plan?.topics, 8).filter(k => TOPICS[k]);
  if (!pool.length) pool = Object.keys(TOPICS).filter(k => TOPICS[k].months.includes(month));
  if (!pool.length) pool = ["weekend_plans", "food", "travel"];
  const recent = S.sessions.slice(0, 10).map(s => s.topic);
  const n = prof().sessionCount || 0;
  return [...pool].map((k, i) => ({ k, c: recent.filter(t => t === k).length, o: (i + n) % pool.length }))
    .sort((a, b) => a.c - b.c || a.o - b.o)[0].k;
}
function duePhrase() {
  const learning = S.phrases.filter(p => p.status !== "mastered" && (!p.lastPracticed || daysSince(p.lastPracticed) >= 1));
  const stale = S.phrases.filter(p => p.status === "mastered" && (!p.lastPracticed || daysSince(p.lastPracticed) >= 21));
  return [...learning, ...stale].sort((a, b) => (Date.parse(a.lastPracticed || 0) || 0) - (Date.parse(b.lastPracticed || 0) || 0))[0] || null;
}
function planNext(forceTopic) {
  const p = prof(), plan = currentPlan(), ss = S.sessions;
  const recent7 = ss.filter(s => daysSince(s.createdAt) < 7);
  const focus = strArr(plan?.focus_skills, 3).filter(k => SKILLS[k]);
  const pool = focus.length ? focus : Object.keys(SKILLS);
  const n = (p.sessionCount || 0) + 1;
  let kind = "normal";
  if (forceTopic) kind = "drill";
  else if (recent7.length >= 2 && !recent7.some(s => s.kind === "stretch")) kind = "stretch";
  else if (n % 6 === 0) kind = "maintenance";
  const weak = k => { const s = p.skills[k]; const sc = (s.scores || []).slice(-3); return s.level + (avg(sc) ?? 3) / 5; };
  let skill;
  if (kind === "maintenance") {
    const others = Object.keys(SKILLS).filter(k => !pool.includes(k));
    const opts = others.length ? others : pool;
    skill = opts[n % opts.length];
  } else {
    const sorted = [...pool].sort((a, b) => weak(a) - weak(b));
    const last2 = ss.slice(0, 2).map(s => s.skill);
    skill = sorted.find(k => !(last2.length === 2 && last2.every(x => x === k))) || sorted[0];
  }
  let level = p.skills[skill].level;
  if (kind === "stretch") level = Math.min(6, level + 1);
  const ov = plan?.partner_level_override;
  if (!forceTopic && ov && (!plan.override_until || localDate() <= plan.override_until)) { level = clamp(ov, 1, 6); kind = "override"; }
  let setting = SETTINGS[plan?.setting] ? plan.setting : null;
  if (!setting) setting = level >= 6 ? "group" : (skill === "exit" && n % 2 ? "event" : (n % 4 === 0 ? "group" : "one_on_one"));
  if (level >= 6 && setting === "one_on_one") setting = "group";
  const depth = level <= 2 ? 1 : level <= 4 ? 2 : 3;
  return { kind, skill, level, topic: forceTopic || pickTopic(plan), setting, depth, phrase: duePhrase() };
}
function applyScore(sk, score, kind, playedLevel, calibrating) {
  const s = { level: 2, up: 0, down: 0, scores: [], ...sk };
  const from = s.level;
  s.scores = [...(s.scores || []), score].slice(-12);
  if (kind === "stretch") { if (score >= 4) s.up += 2; }
  else if (kind === "maintenance") { if (score <= 2) s.down += 1; }
  else if (kind === "override") { if (score >= 4 && playedLevel >= s.level) s.up += 1; }
  else if (score >= 4) { s.up += 1; s.down = 0; }
  else if (score <= 2) { s.down += 1; s.up = 0; }
  else { s.up = 0; s.down = 0; }
  if (calibrating && score === 5 && kind !== "maintenance") s.up = Math.max(s.up, 3);
  if (s.up >= 3 && s.level < 6) { s.level += 1; s.up = 0; s.down = 0; }
  else if (s.down >= 2 && s.level > 1) { s.level -= 1; s.up = 0; s.down = 0; }
  return { s, from, to: s.level };
}

/* ---------- Prompts and schemas ---------- */
const SCORE_PROPS = Object.fromEntries(Object.keys(SKILLS).map(k => [k, nullableInt]));
const SCHEMA = {
  scenario: obj({ title: { type: "string" }, situation: { type: "string" }, partner: obj({ name: { type: "string" }, role: { type: "string" }, vibe: { type: "string" } }),
    others: { type: "array", items: obj({ name: { type: "string" }, role: { type: "string" } }) }, goal: { type: "string" }, opener: { type: "string" },
    primer: strList, try: strList, turns: { type: "integer" } }),
  debrief: obj({ scores: obj(SCORE_PROPS), headline: { type: "string" }, went_well: strList, fix: strList,
    rewrites: { type: "array", items: obj({ said: { type: "string" }, better: { type: "string" }, why: { type: "string" } }) },
    phrases: { type: "array", items: obj({ phrase: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } }) },
    used_phrase: orNull("boolean"), topic_comfort: { type: "integer" }, next_time: { type: "string" },
    technique: obj({ used: { type: "boolean" }, note: { type: "string" } }) }),
  plan: obj({ headline: { type: "string" }, focus_skills: strList, topics: strList, setting: { type: "string", enum: ["one_on_one", "group", "event", "mixed"] },
    partner_level_override: nullableInt, override_until: orNull("string"), sessions_per_week: { type: "integer" }, speak_per_week: { type: "integer" }, notes: strList,
    changes: { type: "array", items: obj({ change: { type: "string" }, why: { type: "string" } }) }, week_summary: { type: "string" } }),
  drill: obj({ title: { type: "string" }, setup: { type: "string" }, opener: { type: "string" }, aim: { type: "string" }, include: strList, seconds: { type: "integer" } }),
  quiz: obj({ questions: { type: "array", items: obj({ q: { type: "string" }, kind: { type: "string", enum: ["fact", "respond"] }, ideal: { type: "string" } }) } }),
  grade: obj({ results: { type: "array", items: obj({ verdict: { type: "string", enum: ["right", "partly", "wrong"] }, feedback: { type: "string" } }) }, score: { type: "integer" }, tip: { type: "string" } })
};
function cleanDebrief(d, target) {
  const scores = {};
  for (const k of Object.keys(SKILLS)) { const v = d?.scores?.[k]; scores[k] = v == null ? null : clamp(v, 1, 5); }
  if (target && scores[target] == null) scores[target] = 3;
  return {
    scores, headline: String(d?.headline || ""), went_well: strArr(d?.went_well, 3), fix: strArr(d?.fix, 3),
    rewrites: (d?.rewrites || []).filter(r => r && r.better).slice(0, 4).map(r => ({ said: String(r.said || ""), better: String(r.better), why: String(r.why || "") })),
    phrases: (d?.phrases || []).filter(p => p && p.phrase).slice(0, 3).map(p => ({ phrase: String(p.phrase).slice(0, 120), meaning: String(p.meaning || ""), example: String(p.example || "") })),
    used_phrase: d?.used_phrase === true ? true : d?.used_phrase === false ? false : null,
    topic_comfort: clamp(d?.topic_comfort || 3, 1, 5), next_time: String(d?.next_time || ""),
    technique: d?.technique ? { used: !!d.technique.used, note: String(d.technique.note || "") } : null
  };
}
const RUBRIC = `Rubric for each skill, 1-5: 1 = not attempted, or it broke the conversation; 2 = attempted but awkward or one-and-done; 3 = fine, nothing a native listener would notice, nothing memorable; 4 = smooth and genuinely engaging; 5 = what a socially skilled native speaker would do.
The text comes from speech recognition or typing: ignore punctuation, capitalization and recognition slips. Judge word choice, sentence structure and social moves.
Skill keys: ${Object.entries(SKILLS).map(([k, v]) => k + " (" + v.label + ")").join(", ")}.`;

/* ---------- Status and errors ---------- */
function flash(msg) { S.flash = msg || ""; renderStatus(); }
async function guard(label, fn) {
  if (S.busy) return;
  S.busy = label; S.flash = ""; render();
  try { await fn(); } catch (e) { const t = ai.errorText(e); if (t) S.flash = t; console.error(e); }
  S.busy = ""; render();
}

/* ---------- Reps ---------- */
function startRep(forceTopic) {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key to start practicing."); return; }
  const next = planNext(forceTopic);
  setView("today");
  return guard("scenario", async () => {
    const plan = currentPlan();
    const recent = S.sessions.slice(0, 6).map(s => s.scenario?.title).filter(Boolean);
    const card = KNOW_COLD.find(c => c.topic === next.topic);
    const r = await ai.askJSON(`You design one speaking drill for an app that trains American small talk.
Learner: ${learner()}
Today's date: ${localDate()}.
Drill spec:
- Target skill: ${SKILLS[next.skill].label}. ${SKILLS[next.skill].desc}
- Partner level ${next.level} (${lvName(next.level)}): ${LEVELS[next.level - 1].behavior}
- Topic: ${TOPICS[next.topic].label}. ${DEPTH[next.depth]}
- Setting: ${SETTINGS[next.setting].label}. ${SETTINGS[next.setting].desc}
- Session type: ${KIND[next.kind].desc}
${plan?.notes?.length ? "- This week's coaching notes: " + strArr(plan.notes, 4).join(" | ") : ""}
${next.phrase ? `- Give the learner a natural chance to use this phrase: "${next.phrase.phrase}" (${next.phrase.meaning || ""})` : ""}
${card ? "- Reference facts for this topic (use for the primer where useful): " + card.essentials.join(" ") : ""}
${S.learnFocus ? "- The learner is practicing a technique from a lesson. Give the partner natural openings for it: " + lessonById(S.learnFocus.id).useIt : ""}
${recent.length ? "- Do not repeat these recent scenarios: " + recent.join("; ") : ""}
Place it in a realistic moment from the learner's own life as described above (work, school, recruiting coffee chats, team dinners, events). Use invented names, never real people.
Do not invent specific recent scores, trades, standings or news. The primer is evergreen facts plus how Americans usually talk about the topic, 3-4 short items.
The goal must make the learner practice the target skill specifically. "try" holds 3 lines or questions the learner could use. "others" is empty unless the setting has more than two people. "turns" is how many exchanges, 6-12.`, SCHEMA.scenario, { feature: "rep" });
    const sc = {
      title: String(r.title || "Today's rep").slice(0, 90), situation: String(r.situation || ""),
      partner: { name: String(r.partner?.name || "Alex"), role: String(r.partner?.role || "a colleague"), vibe: String(r.partner?.vibe || "") },
      others: (r.others || []).filter(o => o?.name).slice(0, 2), goal: String(r.goal || SKILLS[next.skill].desc),
      opener: String(r.opener || "Hey, how's it going?"), primer: strArr(r.primer, 5), try: strArr(r.try, 4), turns: clamp(r.turns || 8, 5, 12)
    };
    S.live = { technique: S.learnFocus?.id || null, phase: "chat", next, scenario: sc, turns: [{ who: "them", text: sc.opener, at: Date.now() }], ended: false, startedAt: new Date().toISOString() };
    if (S.settings.voiceMode) media.speak(sc.opener, voiceOpts());
  });
}
const voiceOpts = () => ({ voiceName: S.settings.voice, rate: Number(S.settings.rate) || 1 });
function partnerSystem(L) {
  const sc = L.scenario, lv = LEVELS[L.next.level - 1], multi = sc.others.length > 0;
  return `You are role-playing in a conversation-practice app for someone learning American small talk. Stay fully in character as ${sc.partner.name}, ${sc.partner.role}. How they talk: ${sc.partner.vibe}
Situation: ${sc.situation}
${multi ? "Others present: " + sc.others.map(o => o.name + " (" + o.role + ")").join(", ") + ". You voice all of them." : ""}
Behavior, level ${lv.n} (${lv.name}): ${lv.behavior}
Topic: ${TOPICS[L.next.topic].label}. Depth: ${DEPTH[L.next.depth]}
Rules:
- Write only what is said aloud, in natural spoken American English. Short stage directions in *asterisks* are fine.
- ${multi ? 'Several people are present. Put each speaker on its own line as "Name: line". Keep the whole reply under 70 words.' : "Keep each reply to 1-3 sentences."}
- Never coach, correct or compliment the learner's English. React the way a real person would, including losing interest if the learner gives you nothing.
- If the learner moves to business or starts wrapping up, respond in character.
- When the conversation reaches a natural end (the learner said goodbye, or after about ${sc.turns} exchanges you wrap it up), finish your reply with the token [END].
You opened the conversation by saying: "${sc.opener}"`;
}
async function sendTurn(text) {
  const L = S.live; if (!L || S.busy || !text.trim()) return;
  const lastThem = [...L.turns].reverse().find(t => t.who === "them");
  L.turns.push({ who: "you", text: text.trim(), at: Date.now(), ms: lastThem ? Date.now() - lastThem.at : null });
  S.busy = "partner"; S.flash = ""; renderToday();
  const msgs = L.turns.slice(1).map(t => ({ role: t.who === "you" ? "user" : "assistant", content: t.text })).slice(-40);
  if (msgs[0]?.role !== "user") msgs.shift();
  S.ctl = new AbortController();
  try {
    const reply = await ai.streamChat(partnerSystem(L), msgs, t => { const b = $("#pending-text"); if (b) { b.textContent = t.replace("[END]", "").trim(); b.classList.remove("thinking"); } }, { signal: S.ctl.signal });
    const clean = reply.replace("[END]", "").trim();
    L.turns.push({ who: "them", text: clean, at: Date.now() });
    if (reply.includes("[END]")) L.ended = true;
    if (S.settings.voiceMode) media.speak(clean, voiceOpts());
  } catch (e) { const t = ai.errorText(e); if (t) S.flash = t; }
  S.ctl = null; S.busy = ""; renderToday(); renderStatus();
}
function metrics(L) {
  const you = L.turns.filter(t => t.who === "you"), them = L.turns.filter(t => t.who === "them");
  const yw = you.reduce((a, t) => a + words(t.text), 0), tw = them.reduce((a, t) => a + words(t.text), 0);
  const ms = you.map(t => t.ms).filter(x => x > 0);
  return { turns: you.length, questions: you.reduce((a, t) => a + (t.text.match(/\?/g) || []).length, 0),
    youWords: yw, themWords: tw, share: yw + tw ? Math.round(100 * yw / (yw + tw)) : 0, avgReplyMs: ms.length ? Math.round(avg(ms)) : null };
}
function debriefRep() {
  const L = S.live; if (!L) return;
  if (!L.turns.some(t => t.who === "you")) { flash("Say at least one thing before the debrief."); return; }
  stopMic(); media.stopSpeaking();
  return guard("debrief", async () => {
    const m = metrics(L), sc = L.scenario;
    const transcript = L.turns.map(t => (t.who === "you" ? "Learner: " : sc.partner.name + ": ") + t.text).join("\n");
    const d = cleanDebrief(await ai.askJSON(`You are a speaking coach for this learner: ${learner()}
They just finished a small-talk drill. Score honestly: inflated scores break the difficulty ladder this app uses to adapt.
Drill: ${sc.title}. ${sc.situation}
Goal: ${sc.goal}
Target skill: ${SKILLS[L.next.skill].label} (${SKILLS[L.next.skill].desc})
Partner level ${L.next.level} (${lvName(L.next.level)}). Topic: ${TOPICS[L.next.topic].label}. Setting: ${SETTINGS[L.next.setting].label}.
${L.next.phrase ? `Phrase they were meant to try: "${L.next.phrase.phrase}"` : "No phrase assigned; used_phrase is null."}
Transcript:
${transcript.slice(-12000)}
Measured: ${m.questions} questions over ${m.turns} turns; the learner's share of words ${m.share}%.
${RUBRIC}
Judge relative to the partner level. The target skill score is required; score other skills only where the transcript clearly shows them, else null.
Give 2-4 rewrites ("said" must quote the learner exactly), favoring lines that sound translated or moves they missed. Give 1-3 phrases worth learning for this topic. topic_comfort is 1-5. next_time is one concrete thing to try next session.
${L.technique ? `Technique being practiced from a lesson: "${lessonById(L.technique).title}": ${lessonById(L.technique).useIt} Set technique.used to whether they clearly did it, and technique.note to one sentence quoting where they did, or how they could have.` : "No technique is being practiced: technique.used is false and technique.note is empty."}`, SCHEMA.debrief, { feature: "rep" }), L.next.skill);
    await saveRep(L, d, m);
  });
}
async function saveRep(L, deb, m) {
  const p = structuredClone(prof());
  const { s, from, to } = applyScore(p.skills[L.next.skill], deb.scores[L.next.skill], L.next.kind, L.next.level, (p.sessionCount || 0) < 3);
  p.skills[L.next.skill] = s;
  for (const [k, v] of Object.entries(deb.scores)) if (k !== L.next.skill && v != null) p.skills[k].scores = [...(p.skills[k].scores || []), v].slice(-12);
  const t = p.topics[L.next.topic] || { sessions: 0, comfort: [] };
  p.topics[L.next.topic] = { sessions: t.sessions + 1, comfort: [...(t.comfort || []), deb.topic_comfort].slice(-6) };
  p.sessionCount = (p.sessionCount || 0) + 1;
  const session = {
    id: db.uid("rep"), createdAt: new Date().toISOString(), date: localDate(), kind: L.next.kind, skill: L.next.skill, level: L.next.level,
    topic: L.next.topic, setting: L.next.setting, scenario: L.scenario, turns: L.turns.map(({ who, text, ms }) => ({ who, text, ms: ms ?? null })),
    metrics: m, debrief: deb, levelChange: from !== to ? { skill: L.next.skill, from, to } : null, phrase: L.next.phrase?.phrase || null, recordingId: null
  };
  if (L.camera) {
    const clip = await L.camera.stop(); L.camera.close(); L.camera = null;
    if (clip?.blob?.size) {
      const rec = { id: db.uid("vid"), createdAt: session.createdAt, kind: "rep", title: L.scenario.title, sessionId: session.id, seconds: clip.seconds, mime: clip.mime, size: clip.blob.size,
        transcript: session.turns.map(t => (t.who === "you" ? "You: " : L.scenario.partner.name + ": ") + t.text).join("\n"), notes: "", debrief: null };
      await db.put("videos", { id: rec.id, blob: clip.blob }); await db.put("recordings", rec); S.recordings.unshift(rec);
      session.recordingId = rec.id;
    }
  }
  if (L.technique) {
    session.technique = { id: L.technique, used: !!deb.technique?.used, note: deb.technique?.note || "" };
    const lp = learnProg(L.technique);
    S.learn = { ...S.learn, [L.technique]: { ...lp, uses: (lp.uses || 0) + (session.technique.used ? 1 : 0), tries: (lp.tries || 0) + 1 } };
    await db.kvSet("learn", S.learn);
    if (S.learnFocus?.id === L.technique) { const left = S.learnFocus.left - 1; S.learnFocus = left > 0 ? { ...S.learnFocus, left } : null; await db.kvSet("learnFocus", S.learnFocus); }
  }
  await db.put("sessions", session); S.sessions.unshift(session);
  await saveProfile(p);
  await usePhrase(L.next.phrase, deb.used_phrase);
  await addPhrases(deb.phrases, L.next.topic, "debrief");
  S.live = { phase: "done", session };
}
async function usePhrase(ph, used) {
  const cur = ph && S.phrases.find(x => x.id === ph.id);
  if (!cur || used == null) return;
  const hits = (cur.hits || 0) + (used ? 1 : 0);
  Object.assign(cur, { hits, lastPracticed: new Date().toISOString(), status: hits >= 3 ? "mastered" : cur.status || "learning" });
  await db.put("phrases", cur);
}
async function addPhrases(list, topic, source) {
  for (const np of list || []) {
    const id = slug(np.phrase);
    if (S.phrases.some(x => x.id === id)) continue;
    const doc = { id, ...np, status: "learning", hits: 0, createdAt: new Date().toISOString(), lastPracticed: null, topic: topic || null, source };
    await db.put("phrases", doc); S.phrases.push(doc);
  }
}

/* ---------- Mic ---------- */
let listener = null;
function startMic(target, onDone) {
  if (!media.canListen) { flash("Speech recognition needs Chrome or Edge. You can type instead."); return; }
  media.stopSpeaking();
  const base = target.value ? target.value.trim() + " " : "";
  listener = new media.Listener((fin, interim, _segs, err) => {
    target.value = (base + fin + (interim ? " " + interim : "")).trim();
    if (err) { flash(err); stopMic(); }
  });
  listener.onDone = onDone;
  listener.start();
  document.querySelectorAll("[data-mic]").forEach(b => b.classList.toggle("live", b.dataset.mic === target.id));
}
function stopMic() {
  if (!listener) return;
  const l = listener; listener = null; l.stop();
  document.querySelectorAll("[data-mic].live").forEach(b => b.classList.remove("live"));
  // let the last result land before handing the text over
  setTimeout(() => l.onDone?.(), 350);
}
function micButton(target, label = "Speak", onDone) {
  if (!media.canListen) return null;
  return h("button", { class: "mic", type: "button", "data-mic": target.id, "aria-label": "Dictate into this box", onclick: e => {
    if (listener) { const same = e.currentTarget.classList.contains("live"); stopMic(); if (same) return; }
    startMic(target, onDone);
  } }, h("span", { class: "dot", "aria-hidden": "true" }), label);
}

/* ---------- Plans ---------- */
function updatePlan(mode, request) {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
  return guard("plan", async () => {
    const p = prof(), plan = currentPlan();
    const ladder = Object.entries(SKILLS).map(([k, v]) => `${k} (${v.label}): level ${p.skills[k].level}, recent scores ${(p.skills[k].scores || []).slice(-5).join(",") || "none"}`).join("\n");
    const topics = Object.entries(p.topics).map(([k, v]) => `${k}: ${v.sessions} reps, comfort ${(v.comfort || []).slice(-3).join(",")}`).join("; ") || "none yet";
    const cold = KNOW_COLD.map(c => c.key + ": " + (S.knowCold[c.key]?.status || "new")).join(", ");
    const sess = S.sessions.slice(0, 14).map(s => `${s.date} ${s.kind} ${s.skill} L${s.level} ${s.topic}: ${s.debrief?.scores?.[s.skill] ?? "?"}/5. ${s.debrief?.headline || ""}`).join("\n") || "none yet";
    const vids = S.recordings.filter(r => r.debrief).slice(0, 5).map(r => `${fmtDate(r.createdAt)} video "${r.title}": ${r.debrief.headline}`).join("\n") || "none";
    const ask = mode === "weekly" ? "Run the weekly review: look at the last 7 days, decide what should change for the coming week, and summarize the week in week_summary."
      : `The learner asked: "${request}". Adjust the plan to honor it. week_summary is empty.`;
    const r = await ai.askJSON(`You maintain the adaptive weekly training plan in a small-talk practice app.
Learner: ${learner()}
Today: ${localDate()}. Use the calendar: US sports seasons and holidays coming up, plus anything in the learner's background (internships, recruiting, events).
Current plan: ${JSON.stringify({ headline: plan?.headline, focus_skills: plan?.focus_skills, topics: plan?.topics, setting: plan?.setting, partner_level_override: plan?.partner_level_override, override_until: plan?.override_until, sessions_per_week: plan?.sessions_per_week, notes: plan?.notes })}
Skill ladder (levels 1-6: ${LEVELS.map(l => l.n + " " + l.name).join(", ")}):
${ladder}
Topic coverage: ${topics}
Know Cold library status: ${cold}
Recent reps, newest first:
${sess}
Recent scored videos:
${vids}
Speaking challenges (timed research, then a structured 1-2 minute talk): ladder level ${speakProf().level} of 6 (${SPEAK_LEVELS.map(l => l.n + " " + l.name).join(", ")}); recent scores ${speakProf().scores.slice(-5).join(",") || "none"}; talks in the last 7 days ${S.speeches.filter(x => daysSince(x.createdAt) < 7).length}.
Lessons (Learn tab): complete ${LESSONS.filter(l => learnProg(l.id).done).map(l => l.id + " " + l.title).join(", ") || "none"}; not yet done ${LESSONS.filter(l => !learnProg(l.id).done).map(l => l.id + " " + l.title).join(", ")}. Mention in notes which lesson to do next when it fits the learner's weakest skills.
Request: ${ask}
Rules: focus_skills holds 1-3 keys from [${Object.keys(SKILLS).join(", ")}], usually the weakest unless the learner asked otherwise. topics holds 2-5 keys from [${Object.keys(TOPICS).join(", ")}]. partner_level_override is null, or 1-6 only when the learner asked to jump to or hold a level; override_until is YYYY-MM-DD or null. sessions_per_week is 3-7, lighter when the learner says a week is heavy. speak_per_week is 1-5 speaking challenges. Keep anything the learner did not ask to change. Every change needs a reason a person would accept, citing evidence from the reps or the calendar. notes holds 2-4 short coaching notes.`, SCHEMA.plan, { feature: "plan" });
    const doc = {
      id: db.uid("plan"), createdAt: new Date().toISOString(), source: mode === "weekly" ? "Weekly review" : "Your request", request: request || null,
      headline: String(r.headline || "This week's plan").slice(0, 160), focus_skills: strArr(r.focus_skills, 3).filter(k => SKILLS[k]),
      topics: strArr(r.topics, 5).filter(k => TOPICS[k]), setting: r.setting || "mixed",
      partner_level_override: r.partner_level_override ? clamp(r.partner_level_override, 1, 6) : null,
      override_until: /^\d{4}-\d{2}-\d{2}$/.test(r.override_until || "") ? r.override_until : null,
      sessions_per_week: clamp(r.sessions_per_week || 5, 3, 7), speak_per_week: clamp(r.speak_per_week || 2, 1, 5), notes: strArr(r.notes, 4),
      changes: (r.changes || []).filter(c => c?.change).slice(0, 6), week_summary: String(r.week_summary || "")
    };
    if (!doc.focus_skills.length) doc.focus_skills = plan?.focus_skills || ["follow_up"];
    await db.put("plans", doc); S.plans.unshift(doc);
    S.flash = "Plan updated.";
  });
}
async function restorePlan(old) {
  const { id, createdAt, source, request, changes, week_summary, ...rest } = old;
  const doc = { ...rest, id: db.uid("plan"), createdAt: new Date().toISOString(), source: "Restored", request: null, week_summary: "",
    changes: [{ change: "Restored the plan from " + fmtDate(createdAt), why: "You rolled back to it." }] };
  await db.put("plans", doc); S.plans.unshift(doc); flash("Plan restored."); render();
}

/* ---------- Know Cold quiz ---------- */
const shuffle = arr => { const b = [...arr]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const bankLeft = key => { const seen = new Set(S.knowCold[key]?.seen || []); return (QUIZ_BANK[key] || []).filter((_, i) => !seen.has(i)).length; };
async function saveQuizScore(key, score, seenIdx) {
  const prev = S.knowCold[key] || { status: "new", scores: [], seen: [] };
  const scores = [...(prev.scores || []), clamp(score, 0, 5)].slice(-6);
  const last2 = scores.slice(-2);
  const status = last2.length === 2 && last2.every(x => x >= 4) ? "cold" : "learning";
  const seen = [...new Set([...(prev.seen || []), ...seenIdx])];
  S.knowCold = { ...S.knowCold, [key]: { status, scores, seen, lastQuiz: new Date().toISOString() } };
  await db.kvSet("knowCold", S.knowCold);
}
// Free quiz from the built-in bank: 3 multiple choice (graded instantly) and 2 "say it back" (self-rated).
function startQuiz(card) {
  stopMic();
  const bank = QUIZ_BANK[card.key] || [];
  const seen = new Set(S.knowCold[card.key]?.seen || []);
  const fresh = bank.map((q, i) => ({ q, i })).filter(x => !seen.has(x.i));
  if (!fresh.length) { S.quiz = { key: card.key, mode: "empty" }; renderCold(); return; }
  let pick = [...shuffle(fresh.filter(x => x.q.o)).slice(0, 3), ...shuffle(fresh.filter(x => x.q.s)).slice(0, 2)];
  if (pick.length < 5) pick = [...pick, ...shuffle(fresh.filter(x => !pick.includes(x))).slice(0, 5 - pick.length)];
  const items = pick.map(({ q, i }) => q.o
    ? { i, kind: "mc", q: q.q, opts: shuffle(q.o.map((t, k) => ({ t, right: k === q.a }))), why: q.w || "", choice: null }
    : { i, kind: "say", s: q.s, model: q.a, answer: "", rating: null, feedback: "" });
  S.quiz = { key: card.key, mode: "bank", items, phase: "answer" };
  renderCold();
}
function checkBankQuiz(card) {
  stopMic();
  const q = S.quiz;
  if (q.items.some(it => it.kind === "mc" && it.choice == null)) { flash("Pick an answer for each multiple-choice question."); return; }
  q.phase = "check"; S.flash = ""; renderStatus();
  finishIfRated(card);
}
async function finishIfRated(card) {
  const q = S.quiz;
  if (!q || q.phase !== "check" || q.items.some(it => it.kind === "say" && !it.rating)) { renderCold(); return; }
  const pts = q.items.reduce((a, it) => a + (it.kind === "mc" ? (it.opts[it.choice]?.right ? 1 : 0) : it.rating === "right" ? 1 : it.rating === "partly" ? 0.5 : 0), 0);
  q.score = Math.floor(pts); q.phase = "done";
  await saveQuizScore(card.key, q.score, q.items.map(it => it.i));
  renderCold();
}
function sayFeedback(card) {
  const q = S.quiz, says = q.items.filter(it => it.kind === "say");
  return guard("grade", async () => {
    const r = await ai.askJSON(`Grade these small-talk replies on "${card.title}" for someone learning American small talk. Be fair, not picky: spoken-style answers and recognition slips are fine. A reply is right if it would work naturally in a real American conversation; partly if it works but sounds stiff, translated or misses the follow-up; wrong if it would land badly.
${says.map((x, n) => `Item ${n + 1}. Someone says: ${x.s}\nA strong reply: ${x.model}\nLearner's reply: ${x.answer || "(blank)"}`).join("\n\n")}
Return one result per item in order. feedback is one or two sentences, and suggests a more natural phrasing when it helps. score counts right answers (partly = half, rounded down). tip is one sentence.`, SCHEMA.grade, { effort: "low", feature: "quiz" });
    says.forEach((x, n) => { const v = r.results?.[n]; if (v) { x.feedback = v.feedback; if (!x.rating) x.rating = v.verdict; } });
  }).then(() => finishIfRated(card));
}
function aiQuiz(card) {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
  return guard("quiz", async () => {
    const r = await ai.askJSON(`Write a 5-question quick quiz on "${card.title}" for someone learning American small talk.
Learner: ${learner()}
Base every question on these reference facts only:
${card.essentials.map(e => "- " + e).join("\n")}
Questions people ask: ${card.ask.join(" | ")}
Mix the kinds: 3 "fact" questions (recall a fact they'd need in conversation) and 2 "respond" questions (someone says a line about this topic, and the learner writes what they'd say back). "ideal" is a short model answer.`, SCHEMA.quiz, { effort: "low", feature: "quiz" });
    S.quiz = { key: card.key, mode: "ai", questions: (r.questions || []).slice(0, 5), phase: "answer", results: null };
  });
}
function gradeAiQuiz(card, answers) {
  return guard("grade", async () => {
    const q = S.quiz;
    const r = await ai.askJSON(`Grade this small-talk quiz on "${card.title}". Be fair, not picky: spoken-style answers and spelling slips are fine, and a "respond" answer is right if it would work naturally in a real American conversation.
Reference facts: ${card.essentials.join(" ")}
${q.questions.map((x, i) => `Q${i + 1} (${x.kind}): ${x.q}\nModel answer: ${x.ideal}\nLearner's answer: ${answers[i] || "(blank)"}`).join("\n\n")}
Return one result per question in order. score is the number right, counting each "partly" as half and rounding down. tip is one sentence on what to review.`, SCHEMA.grade, { effort: "low", feature: "quiz" });
    q.results = r; q.answers = answers; q.phase = "done";
    await saveQuizScore(card.key, r.score, []);
  });
}

/* ---------- Video drills ---------- */
function newDrill() {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
  return guard("drill", async () => {
    const next = planNext();
    const r = await ai.askJSON(`Design one on-camera speaking drill for an app that trains American small talk. The learner records a 45-120 second spoken answer to one opener, as if a real person just said it.
Learner: ${learner()}
Target skill: ${SKILLS[next.skill].label}. ${SKILLS[next.skill].desc}
Topic: ${TOPICS[next.topic].label}. Today's date: ${localDate()}.
"setup" says who is speaking and where (one sentence). "opener" is the line they say. "aim" says what a strong answer does. "include" lists 2-3 things to hit (for example a specific detail, a question back). "seconds" is the target length, 45-120.`, SCHEMA.drill, { effort: "low", feature: "video" });
    S.drill = { phase: "ready", skill: next.skill, topic: next.topic, ...r, seconds: clamp(r.seconds || 60, 30, 180) };
  });
}
const cam = { camera: null, listener: null, timer: null, t0: 0 };
async function openCamera(previewEl) {
  try { cam.camera = new media.Camera(); await cam.camera.open(previewEl); S.drill.phase = "camera"; }
  catch (e) { cam.camera = null; flash(e?.name === "NotAllowedError" ? "Camera access was blocked. Allow it in the browser's site settings, then try again." : "Couldn't open the camera: " + (e?.message || e)); }
  renderFilm();
}
function startRecording() {
  const d = S.drill; d.phase = "recording"; d.transcript = ""; d.segments = [];
  cam.camera.start(); cam.t0 = Date.now();
  cam.listener = new media.Listener((fin, interim, segs) => { d.transcript = fin; d.segments = segs; const el = $("#live-tx"); if (el) el.textContent = (fin + (interim ? " " + interim : "")).trim() || "Listening…"; });
  cam.listener.start();
  cam.timer = setInterval(() => { const el = $("#rec-time"); if (el) el.textContent = fmtSecs((Date.now() - cam.t0) / 1000); }, 500);
  renderFilm();
}
async function stopRecording() {
  clearInterval(cam.timer);
  cam.listener?.stop(); cam.listener = null;
  const clip = await cam.camera.stop(); cam.camera.close(); cam.camera = null;
  await new Promise(r => setTimeout(r, 400));
  const d = S.drill; d.clip = clip; d.phase = "review"; d.url = clip ? URL.createObjectURL(clip.blob) : null;
  renderFilm();
}
async function saveDrill(transcript) {
  const d = S.drill;
  if (!d.clip?.blob?.size) { flash("That recording came out empty. Try again."); return; }
  const rec = { id: db.uid("vid"), createdAt: new Date().toISOString(), kind: "drill", title: d.title, setup: d.setup, opener: d.opener, aim: d.aim, include: d.include,
    skill: d.skill, topic: d.topic, seconds: d.clip.seconds, mime: d.clip.mime, size: d.clip.blob.size, transcript, segments: d.segments || [], notes: "", debrief: null };
  await db.put("videos", { id: rec.id, blob: d.clip.blob }); await db.put("recordings", rec); S.recordings.unshift(rec);
  if (d.url) URL.revokeObjectURL(d.url);
  S.drill = null; flash("Saved. Score it below whenever you're ready.");
  render();
}
function scoreRecording(rec) {
  if (!rec.transcript?.trim()) { flash("Add a transcript first."); return; }
  return guard("video-" + rec.id, async () => {
    const wpm = rec.seconds ? Math.round(words(rec.transcript) / (rec.seconds / 60)) : null;
    const d = cleanDebrief(await ai.askJSON(`You are a speaking coach for this learner: ${learner()}
They recorded themselves on video. ${rec.kind === "drill" ? `Drill: ${rec.setup} The other person said: "${rec.opener}". Aim: ${rec.aim}. Things to hit: ${(rec.include || []).join("; ")}.` : "This is the transcript of a full practice conversation."}
Transcript (speech recognition; it may drop filler words and punctuation):
${rec.transcript.slice(-12000)}
Measured pace: ${wpm ? wpm + " words per minute (natural conversation is roughly 130-170)" : "unknown"}.
${RUBRIC}
${rec.skill ? "Target skill: " + rec.skill + ". Its score is required." : ""} Score other skills only where the transcript clearly shows them, else null. used_phrase is null. In "fix", include pacing advice if the pace is far outside the natural range. Give 2-4 rewrites quoting the learner exactly, and 1-3 phrases worth learning.`, SCHEMA.debrief, { feature: "video" }), rec.skill || null);
    rec.debrief = { ...d, wpm };
    await db.put("recordings", rec);
    const p = structuredClone(prof());
    for (const [k, v] of Object.entries(d.scores)) if (v != null) p.skills[k].scores = [...(p.skills[k].scores || []), v].slice(-12);
    await saveProfile(p);
    await addPhrases(d.phrases, rec.topic, "video");
  });
}
const urls = new Map();
async function videoURL(id) {
  if (urls.has(id)) return urls.get(id);
  const v = await db.get("videos", id);
  if (!v?.blob) return null;
  const u = URL.createObjectURL(v.blob); urls.set(id, u); return u;
}
async function deleteRecording(rec) {
  await db.del("videos", rec.id); await db.del("recordings", rec.id);
  if (urls.has(rec.id)) { URL.revokeObjectURL(urls.get(rec.id)); urls.delete(rec.id); }
  S.recordings = S.recordings.filter(r => r.id !== rec.id);
  for (const s of S.sessions) if (s.recordingId === rec.id) { s.recordingId = null; await db.put("sessions", s); }
  flash("Recording deleted."); render();
}

/* ---------- Rendering ---------- */
function setView(v) {
  if (!VIEWS.includes(v)) v = "today";
  if (S.view === "learn" && v !== "learn") stopLearnAudio();
  S.view = v;
  if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
  for (const a of document.querySelectorAll("nav.tabs a")) { if (a.dataset.v === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
  for (const sec of document.querySelectorAll("section.view")) sec.hidden = sec.id !== "v-" + v;
  render();
}
function render() {
  renderMini(); renderStatus();
  ({ today: renderToday, learn: renderLearn, speak: renderSpeak, cold: renderCold, film: renderFilm, plan: renderPlan, progress: renderProgress, phrases: renderPhrases, settings: renderSettings })[S.view]();
}
function renderMini() {
  const p = prof();
  const m = S.spend?.months?.[monthKey()];
  $("#mini").replaceChildren(...Object.entries(SKILLS).map(([k, v]) => h("span", null, v.short + " ", h("b", { text: p.skills[k].level }))),
    h("span", null, "Speak ", h("b", { text: speakProf().level })),
    h("a", { href: "#progress", class: "spend", title: "Estimated Claude spend this month" }, "Spent ", h("b", { text: money(m?.total || 0) })));
}
function renderStatus() {
  const box = $("#status"); box.replaceChildren();
  if (S.flash) box.append(h("p", { class: "flash", role: "status", text: S.flash }));
}
const chip = (text, cls = "") => h("span", { class: "tag " + cls, text });
function nextChips(n) {
  return h("div", { class: "row" }, chip(KIND[n.kind].label, n.kind === "stretch" ? "gold" : "accent"), chip(SKILLS[n.skill].label), chip("Level " + n.level + " · " + lvName(n.level)), chip(TOPICS[n.topic].label), chip(SETTINGS[n.setting].label));
}
function ladderNote(k) {
  const s = prof().skills[k];
  let t = "Level " + s.level + " of 6 on " + SKILLS[k].short.toLowerCase() + ".";
  if (s.level < 6 && s.up) t += " " + s.up + " of 3 strong reps toward level " + (s.level + 1) + ".";
  if (s.down) t += " One rough rep logged; another drops you a level, which is normal.";
  return h("p", { class: "small muted", text: t });
}

function renderToday() {
  const v = $("#v-today");
  const L = S.live, plan = currentPlan();
  if (L?.phase === "chat") return v.replaceChildren(...chatView(L));
  if (L?.phase === "done") return v.replaceChildren(...doneView(L.session));
  const out = [];
  if (!ai.ready()) out.push(h("div", { class: "card note" }, h("h2", { text: "One setup step" }),
    h("p", { text: "This site runs on your own Anthropic API key, saved only in this browser. Add it in Settings, and fill in a few lines about yourself so the scenarios fit your life." }),
    h("div", { class: "row" }, h("button", { class: "primary", onclick: () => setView("settings") }, "Open settings"))));
  if (plan && daysSince(plan.createdAt) >= 7) out.push(h("div", { class: "banner" }, h("span", null, "Your plan is " + Math.floor(daysSince(plan.createdAt)) + " days old. Time for the weekly review."),
    h("button", { onclick: () => updatePlan("weekly"), disabled: !!S.busy }, "Run weekly review")));
  const n = planNext();
  const week = S.sessions.filter(s => daysSince(s.createdAt) < 7).length;
  out.push(h("article", { class: "card lead" },
    h("div", { class: "spread" }, h("span", { class: "eyebrow", text: "Up next" }), h("span", { class: "small muted num", text: week + " of " + (plan?.sessions_per_week || 5) + " reps this week" })),
    h("h2", { class: "display" }, SKILLS[n.skill].label, h("em", { text: " against a " + lvName(n.level).toLowerCase() + " partner" })),
    nextChips(n),
    h("p", { class: "muted", text: SKILLS[n.skill].desc }),
    n.kind === "stretch" ? h("p", { class: "small", text: "Stretch round: one level above your ladder. A strong score counts double toward promotion, and a rough one costs nothing." }) : null,
    n.kind === "override" ? h("p", { class: "small", text: "You set this level yourself in the plan" + (plan?.override_until ? " until " + fmtDate(plan.override_until + "T12:00") : "") + "." }) : null,
    n.phrase ? h("p", { class: "small" }, "Phrase to work in: ", h("strong", { text: "“" + n.phrase.phrase + "”" })) : null,
    h("div", { class: "row" },
      S.busy === "scenario" ? h("span", { class: "thinking", text: "Setting the scene" }) : h("button", { class: "primary", onclick: () => startRep(), disabled: !!S.busy }, "Start today's rep"),
      h("label", { class: "toggle" }, h("input", { type: "checkbox", id: "voice-mode", checked: S.settings.voiceMode, onchange: async e => { S.settings.voiceMode = e.target.checked; await saveSettings(); } }), " Voice mode")),
    h("p", { class: "small muted", text: media.canListen ? "Voice mode reads the partner's lines aloud. Tap Speak to answer out loud; the text appears as you talk." : "Your browser can't do speech recognition, so you'll type replies. Chrome or Edge adds Speak buttons." })));
  const nl = nextLesson();
  if (S.learnFocus || nl) out.push(h("div", { class: "card" }, h("span", { class: "eyebrow", text: "Learn" }),
    S.learnFocus ? h("p", null, "Practicing ", h("strong", { text: "\u201c" + lessonById(S.learnFocus.id).title + "\u201d" }), " in your reps: " + S.learnFocus.left + " left. " + lessonById(S.learnFocus.id).useIt)
      : h("p", null, "Next lesson: ", h("strong", { text: nl.id + ". " + nl.title }), ". About 10 minutes, and the drill is free."),
    h("div", { class: "row" }, h("button", { onclick: () => S.learnFocus ? openLesson(S.learnFocus.id) : openLesson(nl.id) }, S.learnFocus ? "Review the lesson" : "Start the lesson"))));
  const talks = S.speeches.filter(x => daysSince(x.createdAt) < 7).length;
  out.push(h("div", { class: "card" }, h("div", { class: "spread" }, h("span", { class: "eyebrow", text: "Speaking challenge" }), h("span", { class: "small muted num", text: talks + " of " + (plan?.speak_per_week || 2) + " talks this week" })),
    h("p", { text: "Random topic, timed research with search only, then a structured talk. You're on level " + speakProf().level + ": " + SPEAK_LEVELS[speakProf().level - 1].name + "." }),
    h("div", { class: "row" }, h("button", { onclick: () => setView("speak") }, S.speak && S.speak.phase !== "done" ? "Resume your challenge" : "Go to Speak"))));
  if (plan) out.push(h("div", { class: "card" }, h("span", { class: "eyebrow", text: "This week" }), h("h3", { text: plan.headline }),
    plan.notes?.length ? h("ul", { class: "clean small" }, plan.notes.map(t => h("li", { text: t }))) : null));
  const last = S.sessions[0];
  if (last) out.push(h("div", { class: "card" }, h("span", { class: "eyebrow", text: "Last rep · " + fmtDate(last.createdAt) }),
    h("p", { text: last.debrief?.headline || last.scenario?.title }), last.debrief?.next_time ? h("p", { class: "small" }, h("strong", { text: "Carry over: " }), last.debrief.next_time) : null));
  v.replaceChildren(...out);
}
function chatView(L) {
  const sc = L.scenario, out = [];
  out.push(h("article", { class: "card" },
    h("span", { class: "eyebrow", text: KIND[L.next.kind].label + " · Level " + L.next.level + " " + lvName(L.next.level) }),
    h("h2", { class: "display", text: sc.title }), h("p", { text: sc.situation }),
    h("p", null, h("strong", { text: "Your goal: " }), sc.goal),
    h("p", { class: "small muted", text: sc.partner.name + ", " + sc.partner.role + (sc.others.length ? ". Also there: " + sc.others.map(o => o.name + " (" + o.role + ")").join(", ") : "") + "." }),
    L.next.phrase ? h("p", { class: "small" }, "Work in: ", h("strong", { text: "“" + L.next.phrase.phrase + "”" })) : null,
    h("details", null, h("summary", null, "Primer: " + TOPICS[L.next.topic].label), h("ul", { class: "clean small" }, sc.primer.map(t => h("li", { text: t }))),
      sc.try.length ? h("p", { class: "eyebrow", text: "Lines you could use" }) : null, h("ul", { class: "clean small" }, sc.try.map(t => h("li", { text: t }))))));
  const preview = h("video", { class: "selfcam", id: "rep-cam", playsinline: true, muted: true, autoplay: true });
  if (L.camera?.stream) { preview.srcObject = L.camera.stream; }
  const tr = h("div", { class: "transcript", "aria-live": "polite" });
  for (const t of L.turns) tr.append(h("div", { class: "msg " + t.who }, h("span", { class: "who", text: t.who === "you" ? "You" : sc.partner.name }), t.text,
    t.who === "them" && media.canSpeak ? h("button", { class: "replay", "aria-label": "Play this line aloud", onclick: () => media.speak(t.text, voiceOpts()) }, "Play") : null));
  if (S.busy === "partner") tr.append(h("div", { class: "msg them" }, h("span", { class: "who", text: sc.partner.name }), h("span", { id: "pending-text", class: "thinking", text: "" })));
  const ta = h("textarea", { id: "reply", placeholder: L.ended ? "The conversation wrapped up. Run the debrief." : "Your reply. Tap Speak and say it out loud.", disabled: !!S.busy || L.ended, "aria-label": "Your reply" });
  const send = () => { const t = ta.value; ta.value = ""; sendTurn(t); };
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } });
  out.push(h("div", { class: "card" },
    L.camera ? h("div", { class: "camwrap" }, preview, h("span", { class: "recdot", text: "Recording" })) : null,
    tr,
    h("div", { class: "composer" }, ta,
      h("div", { class: "row" },
        S.busy || L.ended ? null : micButton(ta, "Speak", () => { if (ta.value.trim()) send(); }),
        h("button", { class: "primary", onclick: send, disabled: !!S.busy || L.ended }, "Send"),
        S.busy === "partner" ? h("button", { class: "ghost", onclick: () => S.ctl?.abort() }, "Stop") : null,
        S.busy === "debrief" ? h("span", { class: "thinking", text: "Scoring your rep" }) : h("button", { onclick: debriefRep, disabled: !!S.busy }, "End and debrief"),
        media.canRecord && !L.camera ? h("button", { class: "ghost", disabled: !!S.busy, onclick: async () => {
          try { const c = new media.Camera(); await c.open(); c.start(); L.camera = c; renderToday(); } catch (e) { flash(e?.name === "NotAllowedError" ? "Camera access was blocked. Allow it in the browser's site settings." : "Couldn't open the camera."); }
        } }, "Record on camera") : null,
        h("button", { class: "ghost", disabled: !!S.busy, onclick: () => {
          if (!L._confirm) { L._confirm = true; renderToday(); return; }
          stopMic(); media.stopSpeaking(); if (L.camera) { L.camera.stop(); L.camera.close(); }
          S.live = null; renderToday();
        } }, L._confirm ? "Tap again to discard" : "Discard")),
      h("p", { class: "small muted", text: "Ctrl+Enter sends. Tap Speak again to stop and send. Nothing is scored until you run the debrief." }))));
  setTimeout(() => { if (!S.busy && !L.ended && !listener) ta.focus({ preventScroll: true }); }, 0);
  return out;
}
function debriefBlock(d) {
  return [
    d.went_well.length ? h("div", null, h("h3", { text: "What worked" }), h("ul", { class: "clean" }, d.went_well.map(t => h("li", { text: t })))) : null,
    d.fix.length ? h("div", null, h("h3", { text: "What to fix" }), h("ul", { class: "clean" }, d.fix.map(t => h("li", { text: t })))) : null,
    d.rewrites.length ? h("div", { class: "stack" }, h("h3", { text: "Say it like a native speaker" }), d.rewrites.map(r => h("div", { class: "rewrite" },
      r.said ? h("span", { class: "said", text: r.said }) : null, h("span", { class: "better", text: r.better }), r.why ? h("span", { class: "small muted", text: r.why }) : null))) : null,
    d.phrases.length ? h("div", null, h("h3", { text: "Added to your phrase bank" }), h("ul", { class: "clean" }, d.phrases.map(p => h("li", null, h("strong", { text: p.phrase }), p.meaning ? " · " + p.meaning : "")))) : null
  ];
}
function doneView(s) {
  const d = s.debrief, lc = s.levelChange;
  const stat = (v, k) => h("div", { class: "stat" }, h("span", { class: "v num", text: v }), h("span", { class: "k", text: k }));
  return [h("article", { class: "card" },
    h("span", { class: "eyebrow", text: "Debrief · " + s.scenario.title }),
    lc ? h("p", { class: "levelup " + (lc.to > lc.from ? "up" : "down"), text: SKILLS[lc.skill].short + (lc.to > lc.from ? " up to level " : " back to level ") + lc.to + ": " + lvName(lc.to) }) : null,
    h("h2", { class: "display", text: d.headline }),
    h("div", { class: "stats" }, stat(d.scores[s.skill] + "/5", SKILLS[s.skill].label), stat(s.metrics.questions, "Questions asked"), stat(s.metrics.share + "%", "Your share of the talking"),
      stat(s.metrics.avgReplyMs ? Math.round(s.metrics.avgReplyMs / 1000) + "s" : "n/a", "Average time to reply")),
    ladderNote(s.skill), debriefBlock(d),
    s.phrase ? h("p", { class: "small" }, "Assigned phrase “" + s.phrase + "”: ", h("strong", { text: d.used_phrase ? "used" : "not used yet" })) : null,
    d.next_time ? h("p", null, h("strong", { text: "Next time: " }), d.next_time) : null,
    s.technique ? h("p", { class: "rewrite" }, h("span", { class: "small muted", text: "Lesson technique: " + lessonById(s.technique.id).title }), h("span", { class: "verdict " + (s.technique.used ? "right" : "wrong"), text: s.technique.used ? "You used it." : "Not this time." }), s.technique.note ? h("span", { class: "small", text: s.technique.note }) : null) : null,
    s.recordingId ? h("p", { class: "small" }, "The video of this rep is saved in ", h("a", { href: "#film", onclick: e => { e.preventDefault(); setView("film"); } }, "Film"), ".") : null,
    h("div", { class: "row" }, h("button", { class: "primary", onclick: () => { S.live = null; renderToday(); } }, "Back to today")))];
}

function renderCold() {
  const v = $("#v-cold");
  const done = KNOW_COLD.filter(c => S.knowCold[c.key]?.status === "cold").length;
  const out = [h("header", { class: "section-head" }, h("h2", { class: "display", text: "Know cold" }),
    h("p", { class: "muted", text: "The topics that come up in American offices again and again. Read a card, drill it in a conversation, then pass the quiz twice in a row to mark it cold." }),
    h("p", { class: "small num", text: done + " of " + KNOW_COLD.length + " known cold" }))];
  for (const c of KNOW_COLD) {
    const st = S.knowCold[c.key]?.status || "new";
    const q = S.quiz?.key === c.key ? S.quiz : null;
    out.push(h("details", { class: "card fold", open: q ? true : null },
      h("summary", null, h("span", { class: "fold-title", text: c.title }), chip(st === "cold" ? "Known cold" : st === "learning" ? "Learning" : "New", st === "cold" ? "good" : st === "learning" ? "accent" : "")),
      h("p", { class: "small muted", text: c.when }),
      h("h3", { text: "The essentials" }), h("ul", { class: "clean" }, c.essentials.map(e => h("li", { text: e }))),
      h("h3", { text: "Questions to ask" }), h("ul", { class: "clean" }, c.ask.map(e => h("li", { text: e }))),
      h("p", null, h("strong", { text: "Make it yours: " }), c.bridge),
      h("p", { class: "small" }, h("strong", { text: "Avoid: " }), c.avoid.join("; ") + "."),
      h("div", { class: "row" },
        c.topic ? h("button", { class: "primary", disabled: !!S.busy, onclick: () => startRep(c.topic) }, "Drill this in a conversation") : null,
        h("button", { disabled: !!S.busy, onclick: () => startQuiz(c) }, q ? "New quiz" : "Quiz me"),
        h("span", { class: "small muted num", text: bankLeft(c.key) + " of " + (QUIZ_BANK[c.key] || []).length + " free questions left" })),
      q ? quizView(c, q) : null));
  }
  v.replaceChildren(...out);
}
function quizView(card, q) {
  if (q.mode === "ai") return aiQuizView(card, q);
  if (q.mode === "empty") return h("div", { class: "quiz" },
    h("p", { text: "You've answered every built-in question for this card." }),
    h("div", { class: "row" },
      S.busy === "quiz" ? h("span", { class: "thinking", text: "Writing your quiz" }) : h("button", { class: "primary", disabled: !!S.busy, onclick: () => aiQuiz(card) }, "Fresh questions from Claude (about 0.2 cents)"),
      h("button", { onclick: async () => { S.knowCold = { ...S.knowCold, [card.key]: { ...(S.knowCold[card.key] || {}), seen: [] } }; await db.kvSet("knowCold", S.knowCold); startQuiz(card); } }, "Reuse the built-in questions")));
  const checked = q.phase !== "answer";
  const blocks = q.items.map((it, n) => {
    if (it.kind === "mc") {
      const name = "mc-" + card.key + "-" + n;
      return h("fieldset", { class: "mcq" }, h("legend", null, h("strong", { text: (n + 1) + ". " }), it.q),
        it.opts.map((o, k) => {
          const cls = checked ? (o.right ? "opt right" : k === it.choice ? "opt wrong" : "opt") : "opt";
          return h("label", { class: cls }, h("input", { type: "radio", name, value: String(k), checked: it.choice === k, disabled: checked, onchange: () => { it.choice = k; } }), " ", o.t);
        }),
        checked && it.why ? h("p", { class: "small muted", text: (it.opts[it.choice]?.right ? "Right. " : "Not quite. ") + it.why }) : null);
    }
    const ta = h("textarea", { id: "say-" + card.key + "-" + n, class: "short", placeholder: "What you'd say back. Tap Speak to say it out loud.", disabled: checked, oninput: e => { it.answer = e.target.value; } });
    ta.value = it.answer;
    return h("div", { class: "stack" }, h("p", null, h("strong", { text: (n + 1) + ". They say: " }), it.s), ta,
      !checked ? h("div", { class: "row" }, micButton(ta, "Speak", () => { it.answer = ta.value; })) : null,
      checked ? h("div", { class: "rewrite" }, h("span", { class: "small muted", text: "A strong reply" }), h("span", { class: "better", text: it.model }),
        it.feedback ? h("span", { class: "small", text: "Claude: " + it.feedback }) : null,
        it.rating ? h("span", { class: "verdict " + it.rating, text: it.rating === "right" ? "Nailed it" : it.rating === "partly" ? "Partly" : "Missed" })
          : q.phase === "check" ? h("div", { class: "row" }, h("span", { class: "small", text: "How did yours compare?" }),
            [["right", "Nailed it"], ["partly", "Partly"], ["wrong", "Missed"]].map(([v, l]) => h("button", { class: "pill", onclick: () => { it.rating = v; finishIfRated(card); } }, l))) : null) : null);
  });
  const unrated = q.items.some(it => it.kind === "say" && !it.rating);
  return h("div", { class: "quiz" },
    q.phase === "done" ? h("p", { class: "levelup " + (q.score >= 4 ? "up" : ""), text: q.score + " of 5" + (q.score >= 4 ? ". Nice work." : "") }) : null,
    blocks,
    q.phase === "answer" ? h("div", { class: "row" }, h("button", { class: "primary", onclick: () => checkBankQuiz(card) }, "Check my answers"), h("span", { class: "small muted", text: "Free. No Claude call." })) : null,
    q.phase === "check" && unrated ? h("div", { class: "row" }, S.busy === "grade" ? h("span", { class: "thinking", text: "Getting feedback" })
      : h("button", { disabled: !!S.busy || !ai.ready(), onclick: () => sayFeedback(card) }, "Let Claude grade my replies (about 0.1 cent)")) : null);
}
function aiQuizView(card, q) {
  if (q.phase === "answer") {
    const inputs = q.questions.map((x, i) => h("textarea", { id: "qa-" + i, class: "short", placeholder: x.kind === "respond" ? "What you'd say back" : "Your answer" }));
    return h("div", { class: "quiz" }, q.questions.map((x, i) => h("div", { class: "stack" }, h("p", null, h("strong", { text: (i + 1) + ". " }), x.q), inputs[i], h("div", { class: "row" }, micButton(inputs[i])))),
      h("div", { class: "row" }, S.busy === "grade" ? h("span", { class: "thinking", text: "Grading" }) : h("button", { class: "primary", onclick: () => { stopMic(); gradeAiQuiz(card, inputs.map(t => t.value.trim())); } }, "Check my answers")));
  }
  const r = q.results;
  return h("div", { class: "quiz" }, h("p", { class: "levelup " + (r.score >= 4 ? "up" : ""), text: r.score + " of 5" }),
    q.questions.map((x, i) => h("div", { class: "rewrite" }, h("span", { class: "small muted", text: (i + 1) + ". " + x.q }), h("span", { text: "You: " + (q.answers[i] || "(blank)") }),
      h("span", { class: "verdict " + (r.results[i]?.verdict || "") , text: (r.results[i]?.verdict || "").toUpperCase() + " · " + (r.results[i]?.feedback || "") }), h("span", { class: "small", text: "Model answer: " + x.ideal }))),
    r.tip ? h("p", null, h("strong", { text: "Review: " }), r.tip) : null);
}

function renderFilm() {
  const v = $("#v-film"), d = S.drill, out = [];
  out.push(h("header", { class: "section-head" }, h("h2", { class: "display", text: "Film room" }),
    h("p", { class: "muted", text: "Record yourself answering a real opener, read the live transcript, then get it scored. Videos stay in this browser; download any you want to keep." })));
  if (!media.canRecord) out.push(h("p", { class: "notice", text: "This browser can't record video. Try Chrome, Edge or Safari on a recent version." }));
  const drillCard = h("article", { class: "card lead" });
  if (!d) {
    drillCard.append(h("span", { class: "eyebrow", text: "Video drill" }), h("p", { text: "Get one opener matched to your weakest skill, then answer it on camera for about a minute." }),
      h("div", { class: "row" }, S.busy === "drill" ? h("span", { class: "thinking", text: "Writing your drill" }) : h("button", { class: "primary", disabled: !!S.busy || !media.canRecord, onclick: newDrill }, "New video drill")));
  } else {
    drillCard.append(h("span", { class: "eyebrow", text: "Video drill · " + SKILLS[d.skill].short + " · " + TOPICS[d.topic].label }),
      h("h2", { class: "display", text: d.title }), h("p", { text: d.setup }),
      h("blockquote", { text: "“" + d.opener + "”" }),
      h("p", null, h("strong", { text: "Aim: " }), d.aim), h("ul", { class: "clean small" }, (d.include || []).map(t => h("li", { text: t }))),
      h("p", { class: "small muted num", text: "Target length about " + fmtSecs(d.seconds) }));
    const preview = h("video", { class: "selfcam big", id: "drill-cam", playsinline: true, muted: true, autoplay: true });
    if (d.phase === "ready") drillCard.append(h("div", { class: "row" }, h("button", { class: "primary", onclick: () => openCamera(null) }, "Open camera"), h("button", { class: "ghost", onclick: () => { S.drill = null; renderFilm(); } }, "Skip this one")));
    if (d.phase === "camera" || d.phase === "recording") {
      if (cam.camera?.stream) preview.srcObject = cam.camera.stream;
      drillCard.append(h("div", { class: "camwrap" }, preview, d.phase === "recording" ? h("span", { class: "recdot" }, "Recording ", h("span", { id: "rec-time", class: "num", text: "0:00" })) : null),
        d.phase === "recording" ? h("p", { class: "live-tx", id: "live-tx", text: "Listening…" }) : null,
        h("div", { class: "row" }, d.phase === "camera" ? h("button", { class: "primary", onclick: startRecording }, "Start recording") : h("button", { class: "primary", onclick: stopRecording }, "Stop"),
          h("button", { class: "ghost", onclick: async () => { clearInterval(cam.timer); cam.listener?.stop(); if (cam.camera) { await cam.camera.stop(); cam.camera.close(); cam.camera = null; } d.phase = "ready"; renderFilm(); } }, "Cancel")),
        !media.canListen ? h("p", { class: "small muted", text: "Live transcript needs Chrome or Edge. You can type or paste one after recording." }) : null);
    }
    if (d.phase === "review") {
      const txa = h("textarea", { id: "drill-tx", value: d.transcript || "" }); txa.value = d.transcript || "";
      drillCard.append(d.url ? h("video", { class: "playback", src: d.url, controls: true, playsinline: true }) : null,
        h("label", { class: "eyebrow", for: "drill-tx", text: "Transcript (fix anything it misheard)" }), txa,
        h("div", { class: "row" }, h("button", { class: "primary", onclick: () => saveDrill(txa.value.trim()) }, "Save recording"),
          h("button", { class: "ghost", onclick: () => { if (d.url) URL.revokeObjectURL(d.url); d.phase = "ready"; d.clip = null; renderFilm(); } }, "Record again")));
    }
    if (d.phase === "camera" && !cam.camera) d.phase = "ready";
    setTimeout(() => { const el = $("#drill-cam"); if (el && cam.camera?.stream && el.srcObject !== cam.camera.stream) { el.srcObject = cam.camera.stream; el.play().catch(() => {}); } }, 0);
  }
  out.push(drillCard);
  out.push(h("h3", { class: "list-head", text: "Your recordings · " + S.recordings.length }));
  if (!S.recordings.length) out.push(h("p", { class: "muted small", text: "Nothing yet. Record a drill above, or tap Record on camera during a conversation rep." }));
  for (const r of S.recordings) out.push(recordingCard(r));
  const meter = h("p", { class: "small muted num", id: "storage" });
  out.push(meter);
  v.replaceChildren(...out);
  navigator.storage?.estimate?.().then(e => { meter.textContent = "Browser storage used: " + (e.usage / 1048576).toFixed(0) + " MB of about " + (e.quota / 1073741824).toFixed(1) + " GB available."; }).catch(() => {});
}
function recordingCard(r) {
  const vid = h("video", { class: "playback", controls: true, playsinline: true, preload: "metadata" });
  const cover = h("div", { class: "cover", hidden: true }, "Pass 1: audio only. Listen to your voice: pace, volume, melody, pauses.");
  const wrap = h("div", { class: "reviewwrap" }, vid, cover);
  const txview = h("div", { class: "txview", hidden: true }, fillerMarkup(r.transcript || ""));
  r.passes ||= {};
  const passBtn = (key, label, fn) => h("button", { class: "pill" + (r.passes[key] ? " done" : ""), onclick: async e => { fn(); r.passes[key] = true; e.currentTarget.classList.add("done"); await db.put("recordings", r); } }, label);
  const passRow = h("div", { class: "row" }, h("span", { class: "small", text: "Review in three passes:" }),
    passBtn("audio", "1. Audio only", () => { cover.hidden = false; vid.muted = false; txview.hidden = true; }),
    passBtn("video", "2. Muted video", () => { cover.hidden = true; vid.muted = true; txview.hidden = true; }),
    passBtn("text", "3. Transcript, fillers in red", () => { cover.hidden = true; vid.pause(); txview.replaceChildren(...fillerMarkup(r.transcript || "")); txview.hidden = false; }),
    h("button", { class: "pill", onclick: () => { cover.hidden = true; vid.muted = false; txview.hidden = true; } }, "Normal"));
  const fresh = daysSince(r.createdAt) < 0.8 ? h("p", { class: "small muted", text: "Vinh Giang's tip: wait until tomorrow to review it, so you're less harsh on yourself." }) : null;
  const dl = h("a", { class: "btn ghost", download: "small-talk-" + r.createdAt.slice(0, 10) + "-" + slug(r.title).slice(0, 30) + (r.mime === "video/mp4" ? ".mp4" : ".webm") }, "Download video");
  const notes = h("textarea", { id: "notes-" + r.id, class: "short", placeholder: "Your own notes from watching it back: eye contact, pace, energy" }); notes.value = r.notes || "";
  const tx = h("textarea", { id: "tx-" + r.id, class: "short" }); tx.value = r.transcript || "";
  const card = h("details", { class: "card fold", ontoggle: async e => { if (e.target.open && !vid.src) { const u = await videoURL(r.id); if (u) { vid.src = u; dl.href = u; } else vid.replaceWith(h("p", { class: "notice", text: "The video file is missing from this browser." })); } } },
    h("summary", null, h("span", { class: "fold-title", text: r.title }), h("span", { class: "small muted num", text: fmtDate(r.createdAt) + " · " + fmtSecs(r.seconds || 0) }),
      r.kind === "speech" ? chip("Talk", "accent") : r.debrief ? chip("Scored", "good") : chip(r.kind === "rep" ? "Rep video" : "Not scored")),
    wrap, passRow, txview, fresh, r.opener ? h("blockquote", { text: "“" + r.opener + "”" }) : null,
    h("label", { class: "eyebrow", for: tx.id, text: "Transcript" }), tx,
    h("label", { class: "eyebrow", for: notes.id, text: "Notes" }), notes,
    h("div", { class: "row" },
      h("button", { onclick: async () => { r.transcript = tx.value.trim(); r.notes = notes.value.trim(); await db.put("recordings", r); flash("Saved."); } }, "Save edits"),
      r.kind === "speech" ? h("button", { onclick: () => setView("speak") }, "See the score in Speak")
        : S.busy === "video-" + r.id ? h("span", { class: "thinking", text: "Scoring" }) : h("button", { class: "primary", disabled: !!S.busy, onclick: async () => { r.transcript = tx.value.trim(); r.notes = notes.value.trim(); await scoreRecording(r); } }, r.debrief ? "Score again" : "Score this recording"),
      dl,
      h("button", { class: "ghost danger", onclick: e => { if (!r._confirm) { r._confirm = true; e.currentTarget.textContent = "Tap again to delete"; return; } deleteRecording(r); } }, "Delete")),
    r.debrief ? h("div", { class: "stack" }, h("p", { class: "display-sm", text: r.debrief.headline }), r.debrief.wpm ? h("p", { class: "small muted num", text: "Pace: " + r.debrief.wpm + " words per minute (natural is about 130-170)" }) : null, debriefBlock(r.debrief)) : null);
  return card;
}

function renderPlan() {
  const v = $("#v-plan"), plan = currentPlan(), out = [];
  const ov = plan.partner_level_override;
  out.push(h("article", { class: "card lead" },
    h("div", { class: "spread" }, h("span", { class: "eyebrow", text: "Current plan · " + plan.source + " · " + fmtDate(plan.createdAt) }), h("span", { class: "small muted num", text: plan.sessions_per_week + " reps and " + (plan.speak_per_week || 2) + " talks a week" })),
    h("h2", { class: "display", text: plan.headline }), plan.week_summary ? h("p", { text: plan.week_summary }) : null,
    h("div", { class: "row" }, (plan.focus_skills || []).map(k => chip(SKILLS[k]?.label || k, "accent"))),
    h("div", { class: "row" }, (plan.topics || []).map(k => chip(TOPICS[k]?.label || k)), chip(plan.setting === "mixed" ? "Mixed settings" : SETTINGS[plan.setting]?.label || plan.setting)),
    ov ? h("p", { class: "small" }, h("strong", { text: "Level override: " }), "Level " + ov + " " + lvName(ov) + (plan.override_until ? " until " + fmtDate(plan.override_until + "T12:00") : "")) : null,
    plan.notes?.length ? h("ul", { class: "clean" }, plan.notes.map(t => h("li", { text: t }))) : null,
    plan.changes?.length ? h("div", null, h("h3", { text: "What changed and why" }), h("ul", { class: "clean small" }, plan.changes.map(c => h("li", null, h("strong", { text: c.change }), c.why ? " · " + c.why : "")))) : null));
  const kept = $("#steer")?.value || "";
  const ta = h("textarea", { id: "steer", placeholder: "Tell the plan what you want. “I'm sick of football.” “Focus on ending conversations.” “Dinner with a managing director next Thursday.”" }); ta.value = kept;
  const chips = ["Make partners harder", "Lighter week, school is heavy", "More golf before spring", "Focus on ending conversations", "Skip to busy senior until Friday"];
  out.push(h("div", { class: "card" }, h("h3", { text: "Steer the plan" }),
    h("div", { class: "row" }, chips.map(c => h("button", { class: "pill", onclick: () => { ta.value = c; ta.focus(); } }, c))), ta,
    h("div", { class: "row" }, micButton(ta), S.busy === "plan" ? h("span", { class: "thinking", text: "Rewriting the plan" }) : [
      h("button", { class: "primary", disabled: !!S.busy, onclick: () => { const t = ta.value.trim(); if (t) { ta.value = ""; updatePlan("steer", t); } } }, "Update plan"),
      h("button", { disabled: !!S.busy, onclick: () => updatePlan("weekly") }, "Run weekly review now")])));
  if (S.plans.length > 1) out.push(h("div", { class: "card" }, h("h3", { text: "Plan history" }), S.plans.slice(1, 12).map(p => h("details", null,
    h("summary", null, fmtDate(p.createdAt) + " · " + p.source + " · " + p.headline),
    p.request ? h("p", { class: "small" }, "You asked: “" + p.request + "”") : null,
    p.changes?.length ? h("ul", { class: "clean small" }, p.changes.map(c => h("li", { text: c.change + (c.why ? " · " + c.why : "") }))) : null,
    h("button", { class: "ghost", onclick: () => restorePlan(p) }, "Restore this plan")))));
  v.replaceChildren(...out);
}

function spark(vals) {
  const W = 600, H = 90, pad = 10, ns = "http://www.w3.org/2000/svg";
  if (vals.length < 2) return h("p", { class: "small muted", text: "The trend line appears after two reps." });
  const x = i => pad + i * (W - 2 * pad) / (vals.length - 1), y = v => H - pad - (v - 1) * (H - 2 * pad) / 4;
  const el = (tag, at) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; };
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "spark", role: "img", "aria-label": "Target-skill score per rep, oldest to newest, on a 1 to 5 scale" });
  for (const g of [1, 3, 5]) svg.append(el("line", { x1: pad, x2: W - pad, y1: y(g), y2: y(g), stroke: "var(--line)", "stroke-width": 1 }));
  const pts = vals.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  svg.append(el("polygon", { points: `${x(0)},${H - pad} ${pts} ${x(vals.length - 1)},${H - pad}`, fill: "var(--accent-soft)" }));
  svg.append(el("polyline", { points: pts, fill: "none", stroke: "var(--accent)", "stroke-width": 2 }));
  svg.append(el("circle", { cx: x(vals.length - 1), cy: y(vals.at(-1)), r: 4, fill: "var(--accent)" }));
  return svg;
}
function renderProgress() {
  const v = $("#v-progress"), p = prof(), ss = S.sessions, last10 = ss.slice(0, 10), out = [];
  const qpt = avg(last10.filter(s => s.metrics?.turns).map(s => s.metrics.questions / s.metrics.turns));
  const share = avg(last10.map(s => s.metrics?.share).filter(x => x != null));
  const stat = (val, k) => h("div", { class: "stat" }, h("span", { class: "v num", text: val }), h("span", { class: "k", text: k }));
  out.push(h("div", { class: "stats" }, stat(p.sessionCount || 0, "Reps logged"), stat(ss.filter(s => daysSince(s.createdAt) < 7).length + "/" + (currentPlan()?.sessions_per_week || 5), "Reps this week"),
    stat(qpt == null ? "n/a" : qpt.toFixed(2), "Questions per turn, last 10"), stat(share == null ? "n/a" : Math.round(share) + "%", "Talk share, last 10 (aim 40-55%)"),
    stat(KNOW_COLD.filter(c => S.knowCold[c.key]?.status === "cold").length + "/" + KNOW_COLD.length, "Topics known cold"), stat(S.recordings.length, "Videos recorded")));
  const lad = h("div", { class: "ladder" });
  for (const [k, sk] of Object.entries(SKILLS)) {
    const s = p.skills[k];
    lad.append(h("div", { class: "lrow" }, h("span", { class: "lname", text: sk.label }),
      h("div", { class: "rungs", role: "img", "aria-label": sk.label + ": level " + s.level + " of 6" }, LEVELS.map(l => h("span", { class: "rung" + (l.n <= s.level ? " on" : "") + (l.n === s.level ? " cur" : ""), title: l.name, text: l.n }))),
      h("span", { class: "lmeta", text: lvName(s.level) + (s.up ? " · " + s.up + "/3 toward next" : "") + (s.down ? " · 1 rough rep" : "") + ((s.scores || []).length ? " · last " + s.scores.slice(-3).join(", ") : "") })));
  }
  out.push(spendCard());
  out.push(h("article", { class: "card" }, h("h3", { text: "Lessons" }),
    h("p", { class: "small num", text: LESSONS.filter(l => learnProg(l.id).done).length + " of " + LESSONS.length + " complete" }),
    h("ul", { class: "clean small num" }, LESSONS.filter(l => learnProg(l.id).attempts).map(l => { const lp = learnProg(l.id); return h("li", { text: l.id + " " + l.title + ": best " + lp.best + "/5 over " + lp.attempts + " drill(s)" + (lp.tries ? ", used in " + (lp.uses || 0) + " of " + lp.tries + " reps" : "") }); }))));
  out.push(h("article", { class: "card" }, h("h2", { class: "display", text: "The ladder" }), h("p", { class: "small muted", text: LEVELS.map(l => l.n + " " + l.name).join(" · ") }), lad));
  const spk = speakProf();
  out.push(h("article", { class: "card" }, h("h2", { class: "display", text: "Speaking ladder" }),
    h("p", { class: "small muted", text: SPEAK_LEVELS.map(l => l.n + " " + l.name).join(" \u00b7 ") }),
    h("div", { class: "lrow" }, h("span", { class: "lname", text: "Speaking level" }),
      h("div", { class: "rungs", role: "img", "aria-label": "Speaking level " + spk.level + " of 6" }, SPEAK_LEVELS.map(l => h("span", { class: "rung" + (l.n <= spk.level ? " on" : "") + (l.n === spk.level ? " cur" : ""), title: l.name, text: l.n }))),
      h("span", { class: "lmeta", text: S.speeches.length + " talks" + (spk.up ? " \u00b7 " + spk.up + "/3 toward next" : "") })),
    h("ul", { class: "clean small num" }, Object.entries(SPEAK_SKILLS).map(([k, l]) => { const a = avg((spk.skills[k] || []).slice(-5)); return h("li", { text: l + ": " + (a == null ? "no scores yet" : a.toFixed(1) + "/5 over the last " + Math.min(5, spk.skills[k].length)) }); })),
    S.speeches.length >= 2 ? lineChart(S.speeches.slice(0, 20).reverse().map(x => x.metrics?.fillersPerMin ?? null), { min: 0, max: 15, label: "Filler words per minute, oldest to newest" }) : null));
  out.push(h("div", { class: "card" }, h("h3", { text: "Target-skill score by rep" }), spark(ss.slice(0, 20).reverse().map(s => s.debrief?.scores?.[s.skill]).filter(Boolean))));
  const tk = Object.entries(p.topics);
  out.push(h("div", { class: "card" }, h("h3", { text: "Topics you can hold" }), tk.length ? h("div", { class: "row" }, tk.sort((a, b) => b[1].sessions - a[1].sessions).map(([k, t]) => {
    const c = avg(t.comfort || []); return chip((TOPICS[k]?.label || k) + " · " + t.sessions + " rep" + (t.sessions > 1 ? "s" : "") + (c ? " · " + c.toFixed(1) + "/5" : ""), c >= 4 ? "good" : c && c < 2.5 ? "bad" : "");
  })) : h("p", { class: "small muted", text: "Topics fill in as you practice." })));
  if (ss.length) out.push(h("div", { class: "card" }, h("h3", { text: "Recent reps" }), ss.slice(0, 15).map(s => h("details", null,
    h("summary", null, fmtDate(s.createdAt) + " · " + (SKILLS[s.skill]?.short || s.skill) + " L" + s.level + " · " + (TOPICS[s.topic]?.label || s.topic) + " · " + (s.debrief?.scores?.[s.skill] ?? "?") + "/5" + (s.kind === "stretch" ? " · stretch" : "")),
    h("p", { text: s.debrief?.headline || "" }), h("div", { class: "transcript small" }, (s.turns || []).map(t => h("div", { class: "msg " + t.who }, t.text)))))));
  v.replaceChildren(...out);
}

function renderPhrases() {
  const v = $("#v-phrases"), out = [];
  const keptQ = $("#lookup-q")?.value || "";
  const qIn = h("input", { type: "text", id: "lookup-q", placeholder: "Type a phrase you heard, like “move the needle”", autocomplete: "off" }); qIn.value = keptQ;
  const go = (web) => { const ph = (web && S.lookup ? S.lookup.phrase : qIn.value.trim()) || qIn.value.trim(); if (!ph) return; if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
    guard("lookup", async () => { S.lookup = web ? await ai.lookupPhrase(ph) : await ai.explainPhrase(ph); }); };
  qIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(false); } });
  const L = S.lookup;
  out.push(h("article", { class: "card lead" }, h("span", { class: "eyebrow", text: "Look up a phrase" }),
    h("p", { class: "muted", text: "Explain it answers from Claude's own knowledge for a fraction of a cent. Use the web search only for brand-new slang or when you want sources (about 1 cent)." }),
    h("div", { class: "searchrow" }, qIn, S.busy === "lookup" ? h("span", { class: "thinking", text: "Looking it up" }) : [h("button", { class: "primary", onclick: () => go(false), disabled: !!S.busy }, "Explain it"), h("button", { onclick: () => go(true), disabled: !!S.busy }, "Search the web")]),
    L ? h("div", { class: "lookup" },
      h("div", { class: "spread" }, h("h3", { class: "display-sm", text: L.phrase }), chip(L.register || "", /avoid|slang/i.test(L.register || "") ? "bad" : "accent")),
      h("p", { text: L.meaning }), L.example ? h("p", { class: "example", text: "“" + L.example + "”" }) : null, L.notes ? h("p", { class: "small", text: L.notes }) : null,
      !L.fromWeb ? h("p", { class: "small muted" }, "From Claude's knowledge, not a web search. ", S.busy ? null : h("button", { class: "pill", onclick: () => go(true) }, "Check it on the web (about 1 cent)")) : null,
      L.sources?.length ? h("p", { class: "small muted" }, "Sources: ", L.sources.map((s, i) => [i ? ", " : "", h("a", { href: s.url, target: "_blank", rel: "noopener" }, s.title.length > 50 ? s.title.slice(0, 50) + "…" : s.title)])) : null,
      h("div", { class: "row" }, S.phrases.some(p => p.id === slug(L.phrase)) ? h("span", { class: "small muted", text: "Already in your phrase bank." })
        : h("button", { onclick: async () => { await addPhrases([{ phrase: L.phrase, meaning: L.meaning, example: L.example || "" }], null, "lookup"); flash("Added to your phrase bank."); renderPhrases(); } }, "Save to phrase bank"))) : null));
  const learning = S.phrases.filter(p => p.status !== "mastered"), mastered = S.phrases.filter(p => p.status === "mastered");
  const list = (arr, empty) => arr.length ? arr.map(p => h("div", { class: "rewrite" },
    h("div", { class: "spread" }, h("span", { class: "better", text: p.phrase }), h("span", { class: "small muted num", text: (p.hits || 0) + "/3 used" })),
    p.meaning ? h("span", { class: "small", text: p.meaning }) : null, p.example ? h("span", { class: "small muted", text: "“" + p.example + "”" }) : null,
    h("div", { class: "row" }, h("button", { class: "pill", onclick: async () => { p.status = p.status === "mastered" ? "learning" : "mastered"; await db.put("phrases", p); renderPhrases(); } }, p.status === "mastered" ? "Back to learning" : "I've got this one"),
      h("button", { class: "pill", onclick: async e => { if (!p._confirm) { p._confirm = true; e.currentTarget.textContent = "Tap again to remove"; return; } await db.del("phrases", p.id); S.phrases = S.phrases.filter(x => x.id !== p.id); renderPhrases(); } }, "Remove")))) : h("p", { class: "small muted", text: empty });
  out.push(h("div", { class: "card" }, h("h2", { class: "display", text: "Learning · " + learning.length }), h("p", { class: "small muted", text: "One of these gets worked into each rep. Use it naturally three times and it moves to mastered." }), list(learning, "Debriefs and lookups add phrases here.")));
  out.push(h("div", { class: "card" }, h("h2", { class: "display", text: "Mastered · " + mastered.length }), h("p", { class: "small muted", text: "These come back about every three weeks so they stay fresh." }), list(mastered, "Nothing mastered yet.")));
  v.replaceChildren(...out);
}

function renderSettings() {
  const v = $("#v-settings"), st = S.settings;
  const key = h("input", { type: "password", id: "api-key", autocomplete: "off", spellcheck: "false", placeholder: "sk-ant-..." }); key.value = st.apiKey;
  const model = h("select", { id: "model" }, [["claude-opus-5-5", "Claude Opus 5.5 (best coaching, default)"], ["claude-sonnet-5-5", "Claude Sonnet 5.5 (cheaper)"], ["claude-haiku-5-5", "Claude Haiku 5.5 (cheapest, fastest)"]]
    .map(([id, label]) => h("option", { value: id, selected: st.model === id }, label)));
  const about = h("textarea", { id: "about", placeholder: "A few lines about you: where you grew up, school or job, upcoming internships or events, interests. Scenarios and coaching use this. It stays in this browser." }); about.value = st.about;
  const voiceSel = h("select", { id: "voice" }, h("option", { value: "" }, "Default English voice"), media.voices().map(x => h("option", { value: x.name, selected: st.voice === x.name }, x.name + " (" + x.lang + ")")));
  const rate = h("input", { type: "range", id: "rate", min: "0.7", max: "1.4", step: "0.05", value: String(st.rate || 1) });
  const fileIn = h("input", { type: "file", id: "import", accept: "application/json", class: "visually-hidden" });
  fileIn.addEventListener("change", async () => {
    const f = fileIn.files?.[0]; if (!f) return;
    try { await db.importAll(JSON.parse(await f.text())); await loadAll(); flash("Backup restored."); render(); } catch (e) { flash(e.message || "That file couldn't be read."); }
  });
  v.replaceChildren(
    h("header", { class: "section-head" }, h("h2", { class: "display", text: "Settings" })),
    h("article", { class: "card" }, h("h3", { text: "Your Anthropic API key" }),
      h("p", { class: "small muted" }, "Create one at ", h("a", { href: "https://console.anthropic.com/settings/keys", target: "_blank", rel: "noopener" }, "console.anthropic.com"), ". It's saved only in this browser and sent only to Anthropic. Usage is billed to your Anthropic account; setting a monthly spend limit there is a good idea."),
      key, h("label", { class: "eyebrow", for: "model", text: "Model" }), model,
      h("div", { class: "row" },
        h("button", { class: "primary", onclick: async () => { st.apiKey = key.value.trim(); st.model = model.value; await saveSettings(); flash(st.apiKey ? "Key saved in this browser." : "Key removed."); render(); } }, "Save"),
        h("button", { onclick: () => { key.type = key.type === "password" ? "text" : "password"; } }, "Show or hide"),
        S.busy === "test" ? h("span", { class: "thinking", text: "Testing" }) : h("button", { disabled: !!S.busy, onclick: async () => { st.apiKey = key.value.trim(); st.model = model.value; await saveSettings();
          guard("test", async () => { const r = await ai.askJSON("Reply with ok set to true.", obj({ ok: { type: "boolean" } }), { effort: "low", feature: "other" }); S.flash = r.ok ? "Your key works." : "Unexpected reply."; }); } }, "Test key"))),
    h("article", { class: "card" }, h("h3", { text: "About you" }), about,
      h("div", { class: "row" }, h("button", { class: "primary", onclick: async () => { st.about = about.value.trim(); await saveSettings(); flash("Saved."); } }, "Save"))),
    h("article", { class: "card" }, h("h3", { text: "Voice" }),
      media.canSpeak ? [h("label", { class: "eyebrow", for: "voice", text: "Partner voice" }), voiceSel, h("label", { class: "eyebrow", for: "rate", text: "Speaking speed" }), rate,
        h("div", { class: "row" }, h("button", { onclick: () => media.speak("Hey, good to see you. How was your weekend?", { voiceName: voiceSel.value, rate: Number(rate.value) }) }, "Try it"),
          h("button", { class: "primary", onclick: async () => { st.voice = voiceSel.value; st.rate = Number(rate.value); await saveSettings(); flash("Saved."); } }, "Save"))]
        : h("p", { class: "small muted", text: "This browser can't read text aloud." }),
      h("p", { class: "small muted", text: media.canListen ? "Speech recognition is available here. In Chrome it's processed by Google's speech service." : "Speech recognition isn't available in this browser. Chrome or Edge adds it." })),
    spendCard(),
    h("article", { class: "card" }, h("h3", { text: "Backup" }),
      h("p", { class: "small muted", text: "Your data lives only in this browser. Export a backup now and then, and import it on another device. Videos aren't in the backup; download those from Film. The API key is never exported." }),
      h("div", { class: "row" }, h("button", { onclick: async () => {
        const blob = new Blob([JSON.stringify(await db.exportAll(), null, 1)], { type: "application/json" });
        const a = h("a", { href: URL.createObjectURL(blob), download: "small-talk-ladder-backup-" + localDate() + ".json" }); document.body.append(a); a.click(); a.remove();
      } }, "Export backup"), h("label", { class: "btn", for: "import" }, "Import backup"), fileIn)),
    h("article", { class: "card" }, h("h3", { text: "Start over" }), h("p", { class: "small muted", text: "Deletes every rep, plan, phrase and video in this browser. This can't be undone." }),
      h("button", { class: "ghost danger", onclick: async e => {
        if (!e.currentTarget.dataset.armed) { e.currentTarget.dataset.armed = "1"; e.currentTarget.textContent = "Tap again to delete everything"; return; }
        await new Promise(r => { const req = indexedDB.deleteDatabase("small-talk-ladder"); req.onsuccess = req.onerror = req.onblocked = r; }); location.reload();
      } }, "Delete all my data")));
}

/* ---------- Speak: timed research, then a structured talk ---------- */
const defaultSpeak = () => ({ level: 1, up: 0, down: 0, scores: [], skills: Object.fromEntries(Object.keys(SPEAK_SKILLS).map(k => [k, []])) });
const speakProf = () => ({ ...defaultSpeak(), ...(prof().speak || {}) });
const SP = { cam: null, meter: null, listener: null, timer: null, t0: 0, live: { db: -100, hz: null } };
const mmss = s => Math.floor(Math.max(0, s) / 60) + ":" + z(Math.floor(Math.max(0, s) % 60));
function lsSpeak(v) { try { if (v) localStorage.setItem("stl-speak", JSON.stringify(v)); else localStorage.removeItem("stl-speak"); } catch { /* storage blocked */ } }
function restoreSpeak() {
  try { const v = JSON.parse(localStorage.getItem("stl-speak") || "null"); if (v && (v.phase === "research" || v.phase === "draw" || v.phase === "ready")) S.speak = v; } catch { /* ignore */ }
}
function keepSpeak() { const v = S.speak; lsSpeak(v && ["draw", "research", "ready"].includes(v.phase) ? { ...v } : null); }

function drawTopic(redraw) {
  const sp = speakProf(), lv = SPEAK_LEVELS[clamp(sp.level, 1, 6) - 1];
  const recent = new Set(S.speeches.slice(0, 30).map(x => x.topicId));
  let pool = SPEAK_TOPICS.filter(t => lv.types.includes(t.k) && t.d <= lv.hard && !recent.has(t.id) && t.id !== S.speak?.topic?.id);
  if (lv.n >= 5) { const harder = pool.filter(t => t.d >= 2); if (harder.length > 5) pool = harder; }
  if (!pool.length) pool = SPEAK_TOPICS.filter(t => lv.types.includes(t.k));
  const topic = pool[Math.floor(Math.random() * pool.length)];
  S.speak = { phase: "draw", level: lv.n, topic, fw: TYPE_FRAMEWORK[topic.k], showFw: lv.showFramework, redraws: redraw ? (S.speak?.redraws || 0) + 1 : 0,
    prepSec: lv.prep, target: lv.target, max: lv.max, curveball: lv.curveball, pledge: lv.prep < 60, notes: {}, chosenFw: lv.showFramework ? TYPE_FRAMEWORK[topic.k] : "", mode: "video" };
  keepSpeak(); renderSpeak();
}
function startResearch() {
  const sp = S.speak;
  if (sp.prepSec >= 60 && !sp.pledge) { flash("Tick the research pledge first."); return; }
  sp.phase = "research"; sp.researchEnd = Date.now() + sp.prepSec * 1000; keepSpeak(); renderSpeak();
}
function tickResearch() {
  const sp = S.speak; if (!sp || sp.phase !== "research") return;
  const left = (sp.researchEnd - Date.now()) / 1000;
  const el = $("#speak-clock"); if (el) el.textContent = mmss(left);
  if (left <= 0) { sp.phase = "ready"; keepSpeak(); flash("Time's up. Put the research away and speak."); renderSpeak(); }
}
setInterval(tickResearch, 500);

function cueIndex(fwKey, elapsed, target) {
  const fw = FRAMEWORKS[fwKey]; if (!fw) return -1;
  let acc = 0; const f = Math.min(elapsed / target, 0.999);
  for (let i = 0; i < fw.split.length; i++) { acc += fw.split[i]; if (f < acc) return i; }
  return fw.split.length - 1;
}
async function startSpeaking() {
  const sp = S.speak;
  if (!media.canRecord) { flash("This browser can't record. Try Chrome or Edge."); return; }
  try {
    SP.cam = new media.Camera();
    await SP.cam.open(null, { video: sp.mode === "video" });
  } catch (e) { SP.cam = null; flash(e?.name === "NotAllowedError" ? "Microphone or camera access was blocked. Allow it in the browser's site settings." : "Couldn't open the microphone or camera."); return; }
  sp.phase = "speaking"; sp.transcript = ""; sp.segments = [];
  SP.meter = new media.VoiceMeter(SP.cam.stream, s => { SP.live = s; });
  SP.cam.start(); SP.t0 = Date.now();
  SP.listener = new media.Listener((fin, interim, segs) => { sp.transcript = fin; sp.segments = segs; const el = $("#speak-tx"); if (el) el.textContent = (fin + (interim ? " " + interim : "")).trim() || "Listening…"; });
  SP.listener.start();
  SP.timer = setInterval(() => {
    const el = (Date.now() - SP.t0) / 1000;
    const c = $("#speak-time"); if (c) c.textContent = mmss(el) + " / " + mmss(sp.target);
    const idx = cueIndex(sp.chosenFw || "prep", el, sp.target);
    document.querySelectorAll("#speak-cues li").forEach((li, i) => li.classList.toggle("now", i === idx));
    const bar = $("#speak-level"); if (bar) bar.style.width = Math.max(0, Math.min(100, (SP.live.db + 60) * 2)) + "%";
    const hz = $("#speak-hz"); if (hz) hz.textContent = SP.live.hz ? SP.live.hz + " Hz" : "";
    if (el >= sp.max) stopSpeaking();
  }, 200);
  renderSpeak();
  const pv = $("#speak-cam"); if (pv && sp.mode === "video") { pv.srcObject = SP.cam.stream; pv.play().catch(() => {}); }
}
async function stopSpeaking() {
  const sp = S.speak; if (!sp || sp.phase !== "speaking") return;
  clearInterval(SP.timer);
  SP.listener?.stop(); SP.listener = null;
  sp.samples = SP.meter?.stop() || []; SP.meter = null;
  const clip = await SP.cam.stop(); SP.cam.close(); SP.cam = null;
  await new Promise(r => setTimeout(r, 400));
  sp.clip = clip; sp.url = clip ? URL.createObjectURL(clip.blob) : null;
  sp.seconds = clip?.seconds || Math.round((Date.now() - SP.t0) / 1000);
  sp.metrics = media.analyzeVoice(sp.samples, sp.transcript || "", sp.seconds, FILLERS);
  if (sp.curveball) { const list = CURVEBALLS[sp.topic.k] || CURVEBALLS.opinion; sp.cbq = list[Math.floor(Math.random() * list.length)]; sp.phase = "curveball"; }
  else sp.phase = "review";
  renderSpeak();
}
function startCurveball() {
  const sp = S.speak; sp.phase = "curveball-live"; sp.cba = ""; SP.t0 = Date.now();
  SP.listener = new media.Listener(fin => { sp.cba = fin; const el = $("#cb-tx"); if (el) el.textContent = fin || "Listening…"; });
  SP.listener.start();
  SP.timer = setInterval(() => { const el = (Date.now() - SP.t0) / 1000; const c = $("#cb-time"); if (c) c.textContent = mmss(45 - el); if (el >= 45) stopCurveball(); }, 250);
  renderSpeak();
}
function stopCurveball() {
  clearInterval(SP.timer); SP.listener?.stop(); SP.listener = null;
  setTimeout(() => { S.speak.phase = "review"; renderSpeak(); }, 350);
}
function abandonSpeak() {
  clearInterval(SP.timer); SP.listener?.stop(); SP.listener = null; SP.meter?.stop(); SP.meter = null;
  if (SP.cam) { SP.cam.stop(); SP.cam.close(); SP.cam = null; }
  if (S.speak?.url) URL.revokeObjectURL(S.speak.url);
  S.speak = null; keepSpeak(); renderSpeak();
}

const SPEAK_SCHEMA = obj({
  scores: obj(Object.fromEntries(Object.keys(SPEAK_SKILLS).map(k => [k, { type: "integer" }]))),
  framework_used: { type: "string" },
  structure_map: { type: "array", items: obj({ step: { type: "string" }, quote: { type: "string" } }) },
  headline: { type: "string" }, went_well: strList, fix: strList,
  rewrite: obj({ said: { type: "string" }, better: { type: "string" }, why: { type: "string" } }),
  model_outline: strList, delivery_notes: { type: "string" }, curveball_feedback: { type: "string" }, next_time: { type: "string" }
});
function metricsText(m) {
  return `Length ${m.seconds}s; pace ${m.wpm} words per minute (natural talks run about 130-160); filler words ${m.fillerCount} (${m.fillersPerMin}/min: ${Object.entries(m.fillers).map(([f, c]) => f + " x" + c).join(", ") || "none"}; the transcript may drop "um" and "uh"); pauses of 0.5s+: ${m.pauses} (${m.pausesPerMin}/min, longest ${m.longestPause}s); volume variation ${m.volumeVariety} dB (under about 3 sounds flat); pitch range ${m.pitchRange ?? "unknown"} semitones (under about 4 sounds monotone, 8+ is expressive).`;
}
function scoreSpeech(sp, existing) {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
  const transcript = existing ? existing.transcript : sp.transcript;
  if (!String(transcript || "").trim()) { flash("There's no transcript to score. Type or paste what you said first."); return; }
  return guard("speak-score", async () => {
    const src = existing || sp;
    const fwKey = src.chosenFw || src.framework || TYPE_FRAMEWORK[src.topic?.k || src.type];
    const fw = FRAMEWORKS[fwKey];
    const r = await ai.askJSON(`You are a speaking coach. The learner did a timed public-speaking challenge: they researched a random topic with web search only (no AI), then spoke for about ${Math.round((src.target || 120) / 60 * 10) / 10} minutes.
Learner: ${learner()}
Topic: "${src.topic?.t || src.topicText}" (type: ${TYPE_LABEL[src.topic?.k || src.type]}). Challenge level ${src.level} of 6.
${src.showFw || src.frameworkShown ? `Framework they were asked to use: ${fw.name}, steps: ${fw.steps.map(s => s[0] + " (" + s[1] + ")").join("; ")}.` : `They had to choose their own structure. The best fit for this topic type is ${fw.name}. They said they'd use: ${src.chosenFw ? FRAMEWORKS[src.chosenFw]?.name : "not stated"}.`}
Their research notes: ${JSON.stringify(src.notes || {})}
Transcript (speech recognition; punctuation is unreliable, and "um"/"uh" may be missing):
${String(transcript).slice(0, 10000)}
${src.cbq ? `Curveball follow-up question: "${src.cbq}". Their answer: ${src.cba || "(no answer)"}` : "No curveball question."}
Measured delivery, computed from the audio: ${metricsText(src.metrics)}
Score each skill 1-5, honestly: inflated scores break the difficulty ladder. 1 = missing; 2 = attempted but weak; 3 = solid and clear; 4 = polished and persuasive; 5 = what a skilled professional speaker would do.
- point: was the main point clear and stated early (answer first)?
- support: were the reasons specific, with evidence, numbers or an example from their research?
- close: did they end by restating the point, sharper, instead of trailing off?
- structure: did they follow the right framework in order, without rambling or repeating?
- delivery: use the measured numbers (pace, fillers, pauses, vocal variety in volume and pitch) plus word choice. Vinh Giang's five vocal foundations: rate, volume, pitch, tonality, pause. Slowing down on the key point and pausing instead of using fillers are strengths.
framework_used names the structure they actually followed. structure_map gives one entry per step of the expected framework with the learner's shortest quote that fills it, or "" if the step is missing.
went_well and fix hold 1-3 items each. rewrite takes their weakest sentence (quoted exactly) and gives a stronger spoken version. model_outline gives one short line per framework step showing how a strong speaker would have structured this topic. delivery_notes is 2-3 sentences interpreting the measured numbers. curveball_feedback is one or two sentences, or "" if there was no curveball. next_time is one concrete thing to try.`, SPEAK_SCHEMA, { feature: "speak" });
    const scores = {};
    for (const k of Object.keys(SPEAK_SKILLS)) scores[k] = clamp(r.scores?.[k] ?? 3, 1, 5);
    const result = { scores, overall: Math.round(avg(Object.values(scores))), framework_used: String(r.framework_used || ""),
      structure_map: (r.structure_map || []).slice(0, 6), headline: String(r.headline || ""), went_well: strArr(r.went_well, 3), fix: strArr(r.fix, 3),
      rewrite: r.rewrite?.better ? r.rewrite : null, model_outline: strArr(r.model_outline, 6), delivery_notes: String(r.delivery_notes || ""),
      curveball_feedback: String(r.curveball_feedback || ""), next_time: String(r.next_time || "") };
    const p = structuredClone(prof());
    const spk = { ...defaultSpeak(), ...(p.speak || {}) };
    const { s, from, to } = applyScore({ level: spk.level, up: spk.up, down: spk.down, scores: spk.scores }, result.overall, "normal", src.level, spk.scores.length < 3);
    spk.level = s.level; spk.up = s.up; spk.down = s.down; spk.scores = s.scores;
    for (const [k, v] of Object.entries(scores)) spk.skills[k] = [...(spk.skills[k] || []), v].slice(-12);
    p.speak = spk; await saveProfile(p);
    result.levelChange = from !== to ? { from, to } : null;
    if (existing) { existing.score = result; await db.put("speeches", existing); }
    else { await saveSpeech(sp, result); }
  });
}
async function saveSpeech(sp, result) {
  const id = db.uid("talk"), createdAt = new Date().toISOString();
  let recordingId = null;
  if (sp.clip?.blob?.size) {
    recordingId = db.uid("vid");
    const rec = { id: recordingId, createdAt, kind: "speech", title: sp.topic.t, speechId: id, seconds: sp.seconds, mime: sp.clip.mime, size: sp.clip.blob.size,
      transcript: sp.transcript || "", notes: "", debrief: null, passes: {} };
    await db.put("videos", { id: recordingId, blob: sp.clip.blob }); await db.put("recordings", rec); S.recordings.unshift(rec);
  }
  const doc = { id, createdAt, date: localDate(), level: sp.level, topicId: sp.topic.id, topic: sp.topic, type: sp.topic.k, framework: sp.fw, chosenFw: sp.chosenFw,
    frameworkShown: sp.showFw, prepSec: sp.prepSec, target: sp.target, notes: sp.notes, transcript: sp.transcript || "", cbq: sp.cbq || null, cba: sp.cba || "",
    metrics: sp.metrics, score: result || null, recordingId };
  await db.put("speeches", doc); S.speeches.unshift(doc);
  if (sp.url) URL.revokeObjectURL(sp.url);
  S.speak = { phase: "done", savedId: id }; keepSpeak();
}

function lineChart(vals, { min, max, label }) {
  const W = 600, H = 70, pad = 6, ns = "http://www.w3.org/2000/svg";
  const pts = vals.map((v, i) => [pad + i * (W - 2 * pad) / Math.max(1, vals.length - 1), v]).filter(p => p[1] != null);
  if (pts.length < 2) return h("p", { class: "small muted", text: label + ": not enough data." });
  const y = v => H - pad - (Math.min(max, Math.max(min, v)) - min) * (H - 2 * pad) / (max - min);
  const el = (tag, at) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); return e; };
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "spark", role: "img", "aria-label": label + " over the talk" });
  svg.append(el("line", { x1: pad, x2: W - pad, y1: H - pad, y2: H - pad, stroke: "var(--line)", "stroke-width": 1 }));
  svg.append(el("polyline", { points: pts.map(([x, v]) => x.toFixed(1) + "," + y(v).toFixed(1)).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 1.5 }));
  return h("div", null, h("span", { class: "eyebrow", text: label }), svg);
}
function metricsPanel(m, samples, target) {
  const verdict = (v, lo, hi, low, mid, high) => v == null ? "" : v < lo ? low : v > hi ? high : mid;
  const stat = (v, k, note) => h("div", { class: "stat" }, h("span", { class: "v num", text: v }), h("span", { class: "k", text: k }), note ? h("span", { class: "small muted", text: note }) : null);
  return h("div", { class: "stack" },
    h("div", { class: "stats" },
      stat(mmss(m.seconds), "Length", target ? (m.seconds >= target * 0.9 ? "Hit the target" : "Target " + mmss(target)) : ""),
      stat(m.wpm, "Words per minute", verdict(m.wpm, 120, 170, "On the slow side", "Natural pace", "Fast; slow down on key points")),
      stat(m.fillerCount, "Filler words", m.fillerCount ? Object.entries(m.fillers).map(([f, c]) => f + " " + c).join(", ") : "Clean"),
      stat(m.pausesPerMin, "Pauses per minute", verdict(m.pausesPerMin, 3, 15, "Few pauses; let points land", "Good use of pauses", "Lots of stops")),
      stat(m.volumeVariety + " dB", "Volume variety", verdict(m.volumeVariety, 3, 99, "Flat volume", "Varied", "")),
      stat(m.pitchRange == null ? "n/a" : m.pitchRange + " st", "Pitch range", verdict(m.pitchRange, 4, 8, "Close to monotone", "Some melody", "Expressive"))),
    samples?.length ? lineChart(samples.map(s => s.db), { min: -60, max: -5, label: "Loudness" }) : null,
    samples?.length ? lineChart(samples.map(s => s.hz), { min: 70, max: 350, label: "Pitch" }) : null,
    h("p", { class: "small muted", text: "Measured on your device from the audio, with rough thresholds. Use the trend across talks more than any single number." }));
}
function speechResult(r) {
  return h("div", { class: "stack" },
    r.levelChange ? h("p", { class: "levelup " + (r.levelChange.to > r.levelChange.from ? "up" : "down"), text: "Speaking " + (r.levelChange.to > r.levelChange.from ? "up to level " : "back to level ") + r.levelChange.to + ": " + SPEAK_LEVELS[r.levelChange.to - 1].name }) : null,
    h("h2", { class: "display", text: r.headline }),
    h("div", { class: "stats" }, Object.entries(SPEAK_SKILLS).map(([k, l]) => h("div", { class: "stat" }, h("span", { class: "v num", text: r.scores[k] + "/5" }), h("span", { class: "k", text: l })))),
    r.framework_used ? h("p", { class: "small" }, h("strong", { text: "Structure you used: " }), r.framework_used) : null,
    r.structure_map.length ? h("div", { class: "stack" }, h("h3", { text: "How your talk mapped to the framework" }), r.structure_map.map(x => h("div", { class: "rewrite" }, h("span", { class: "small muted", text: x.step }), x.quote ? h("span", { text: "“" + x.quote + "”" }) : h("span", { class: "verdict wrong", text: "Missing" })))) : null,
    r.went_well.length ? h("div", null, h("h3", { text: "What worked" }), h("ul", { class: "clean" }, r.went_well.map(t => h("li", { text: t })))) : null,
    r.fix.length ? h("div", null, h("h3", { text: "What to fix" }), h("ul", { class: "clean" }, r.fix.map(t => h("li", { text: t })))) : null,
    r.rewrite ? h("div", { class: "rewrite" }, h("span", { class: "said", text: r.rewrite.said }), h("span", { class: "better", text: r.rewrite.better }), h("span", { class: "small muted", text: r.rewrite.why })) : null,
    r.delivery_notes ? h("p", null, h("strong", { text: "Delivery: " }), r.delivery_notes) : null,
    r.curveball_feedback ? h("p", null, h("strong", { text: "Curveball: " }), r.curveball_feedback) : null,
    r.model_outline.length ? h("div", null, h("h3", { text: "A model outline for this topic" }), h("ol", { class: "clean" }, r.model_outline.map(t => h("li", { text: t })))) : null,
    r.next_time ? h("p", null, h("strong", { text: "Next time: " }), r.next_time) : null);
}
function frameworkCard(key, compact) {
  const fw = FRAMEWORKS[key];
  return h("div", { class: "fwcard" }, h("div", { class: "spread" }, h("strong", { text: fw.name }), h("span", { class: "small muted", text: fw.use })),
    h("ol", { class: "clean small" }, fw.steps.map(([s, d]) => h("li", null, h("strong", { text: s + ": " }), d))),
    compact ? null : h("p", { class: "small muted", text: "Example: " + fw.sample }));
}

function renderSpeak() {
  const v = $("#v-speak"); if (!v) return;
  if (S.view !== "speak") return;
  const spk = speakProf(), lv = SPEAK_LEVELS[clamp(spk.level, 1, 6) - 1], sp = S.speak, out = [];
  out.push(h("header", { class: "section-head" }, h("h2", { class: "display", text: "Speak" }),
    h("p", { class: "muted", text: "Draw a random topic, research it with search only, then speak in a clear structure. Scored on structure and delivery." }),
    h("p", { class: "small num" }, h("strong", { text: "Level " + lv.n + ": " + lv.name }), " · prep " + (lv.prep >= 60 ? lv.prep / 60 + " min" : lv.prep + " sec") + " · speak " + mmss(lv.target) + (lv.curveball ? " · plus a follow-up question" : "") + (spk.up ? " · " + spk.up + "/3 toward next level" : ""))));
  const card = h("article", { class: "card lead" });
  if (!sp || sp.phase === "done") {
    const last = sp?.phase === "done" ? S.speeches.find(x => x.id === sp.savedId) : null;
    if (last?.score) card.append(h("span", { class: "eyebrow", text: "Your talk · " + last.topic.t }), speechResult(last.score));
    else if (last) card.append(h("span", { class: "eyebrow", text: "Saved" }), h("p", { text: "Your talk is saved without a score. You can score it from the history below." }));
    else card.append(h("span", { class: "eyebrow", text: "Today's challenge" }), h("p", { text: lv.showFramework ? "You'll get a topic and the framework that fits it." : "You'll get a topic. Picking the right framework is part of the challenge." }));
    card.append(h("div", { class: "row" }, h("button", { class: "primary", onclick: () => drawTopic(false) }, last ? "New challenge" : "Draw a topic")));
  } else if (sp.phase === "draw") {
    const sel = h("select", { id: "prep-time", onchange: e => { sp.prepSec = Number(e.target.value); keepSpeak(); } },
      [[10, "10 seconds"], [120, "2 minutes"], [300, "5 minutes"], [600, "10 minutes"], [900, "15 minutes"]].map(([s, l]) => h("option", { value: s, selected: sp.prepSec === s }, l)));
    card.append(h("span", { class: "eyebrow", text: TYPE_LABEL[sp.topic.k] + " · level " + sp.level }), h("h2", { class: "display topic", text: sp.topic.t }),
      sp.showFw ? frameworkCard(sp.fw) : h("p", { class: "small", text: "Pick your own structure. The frameworks are listed further down this page." }),
      h("div", { class: "row" }, h("label", { class: "eyebrow", for: "prep-time", text: "Research time" }), sel),
      sp.prepSec >= 60 ? h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: sp.pledge, onchange: e => { sp.pledge = e.target.checked; keepSpeak(); } }), " I'll research with search only, no AI tools.") : null,
      h("div", { class: "row" }, h("button", { class: "primary", onclick: startResearch }, sp.prepSec >= 60 ? "Start research timer" : "Start the countdown"),
        sp.redraws < 1 ? h("button", { onclick: () => drawTopic(true) }, "Redraw once") : null, h("button", { class: "ghost", onclick: abandonSpeak }, "Cancel")));
  } else if (sp.phase === "research" || sp.phase === "ready") {
    const q = encodeURIComponent(sp.topic.k === "impromptu" ? sp.topic.t : sp.topic.t.replace(/^(Explain|Pitch|Tell me about)\s+/i, ""));
    const steps = sp.showFw ? FRAMEWORKS[sp.fw].steps.map(s => s[0]) : sp.chosenFw ? FRAMEWORKS[sp.chosenFw].steps.map(s => s[0]) : ["Main point", "Support", "Close"];
    card.append(h("div", { class: "spread" }, h("span", { class: "eyebrow", text: sp.phase === "research" ? "Research" : "Ready" }),
      sp.phase === "research" ? h("span", { class: "clock num", id: "speak-clock", text: mmss((sp.researchEnd - Date.now()) / 1000) }) : null),
      h("h2", { class: "display topic", text: sp.topic.t }),
      sp.phase === "research" && sp.prepSec >= 60 ? h("p", { class: "small" }, "Search: ",
        h("a", { href: "https://www.google.com/search?q=" + q, target: "_blank", rel: "noopener" }, "Google"), " · ",
        h("a", { href: "https://en.wikipedia.org/w/index.php?search=" + q, target: "_blank", rel: "noopener" }, "Wikipedia"), " · ",
        h("a", { href: "https://news.google.com/search?q=" + q, target: "_blank", rel: "noopener" }, "Google News"), ". Keywords only in your notes, not full sentences.") : null,
      !sp.showFw ? h("div", { class: "row" }, h("label", { class: "eyebrow", for: "fw-choice", text: "Framework I'll use" }),
        h("select", { id: "fw-choice", onchange: e => { sp.chosenFw = e.target.value; keepSpeak(); renderSpeak(); } }, h("option", { value: "" }, "Choose"), Object.entries(FRAMEWORKS).map(([k, f]) => h("option", { value: k, selected: sp.chosenFw === k }, f.name)))) : null,
      h("div", { class: "notes-grid" }, steps.map((s, i) => { const ta = h("textarea", { id: "note-" + i, class: "short", placeholder: s, oninput: e => { sp.notes[s] = e.target.value; keepSpeak(); } }); ta.value = sp.notes[s] || ""; return h("label", { class: "stack" }, h("span", { class: "eyebrow", text: s }), ta); })),
      h("div", { class: "row" }, h("span", { class: "eyebrow", text: "Record as" }),
        ["video", "audio"].map(m => h("label", { class: "toggle" }, h("input", { type: "radio", name: "speak-mode", checked: sp.mode === m, onchange: () => { sp.mode = m; keepSpeak(); } }), m === "video" ? " Video" : " Audio only"))),
      h("div", { class: "row" }, h("button", { class: "primary", onclick: startSpeaking }, sp.phase === "research" ? "I'm ready, start speaking" : "Start speaking"), h("button", { class: "ghost", onclick: abandonSpeak }, "Cancel")),
      h("p", { class: "small muted", text: "Aim for " + mmss(sp.target) + ". It stops automatically at " + mmss(sp.max) + ". Stand up if you can; Vinh Giang says how you rehearse is how you present." }));
  } else if (sp.phase === "speaking") {
    const fw = FRAMEWORKS[sp.chosenFw || "prep"];
    card.append(h("div", { class: "spread" }, h("span", { class: "recdot static", text: "Recording" }), h("span", { class: "clock num", id: "speak-time", text: "0:00 / " + mmss(sp.target) })),
      h("h2", { class: "display topic", text: sp.topic.t }),
      sp.mode === "video" ? h("video", { class: "selfcam big", id: "speak-cam", playsinline: true, muted: true, autoplay: true }) : null,
      h("ol", { class: "cues", id: "speak-cues" }, fw.steps.map(([s]) => h("li", { text: s }))),
      h("div", { class: "meter" }, h("span", { id: "speak-level" }), h("small", { id: "speak-hz", class: "num" })),
      h("p", { class: "live-tx", id: "speak-tx", text: "Listening…" }),
      h("div", { class: "row" }, h("button", { class: "primary", onclick: stopSpeaking }, "Stop")));
  } else if (sp.phase === "curveball" || sp.phase === "curveball-live") {
    card.append(h("span", { class: "eyebrow", text: "Follow-up question" }), h("blockquote", { text: sp.cbq }),
      sp.phase === "curveball" ? h("div", { class: "row" }, h("button", { class: "primary", onclick: startCurveball }, "Answer it (45 seconds)"), h("button", { class: "ghost", onclick: () => { sp.phase = "review"; renderSpeak(); } }, "Skip"))
        : [h("span", { class: "clock num", id: "cb-time", text: "0:45" }), h("p", { class: "live-tx", id: "cb-tx", text: "Listening…" }), h("div", { class: "row" }, h("button", { class: "primary", onclick: stopCurveball }, "Done"))]);
  } else if (sp.phase === "review") {
    const ta = h("textarea", { id: "speak-transcript", oninput: e => { sp.transcript = e.target.value; } }); ta.value = sp.transcript || "";
    card.append(h("span", { class: "eyebrow", text: "Review · " + sp.topic.t }),
      sp.url ? (sp.mode === "video" ? h("video", { class: "playback", src: sp.url, controls: true, playsinline: true }) : h("audio", { src: sp.url, controls: true })) : null,
      metricsPanel(sp.metrics, sp.samples, sp.target),
      h("label", { class: "eyebrow", for: "speak-transcript", text: "Transcript (fix anything it misheard)" }), ta,
      sp.cbq ? h("p", { class: "small" }, h("strong", { text: "Follow-up: " }), sp.cbq + " — " + (sp.cba || "(no answer)")) : null,
      h("div", { class: "row" },
        S.busy === "speak-score" ? h("span", { class: "thinking", text: "Scoring your talk" }) : h("button", { class: "primary", disabled: !!S.busy, onclick: () => { sp.metrics = media.analyzeVoice(sp.samples || [], sp.transcript || "", sp.seconds, FILLERS); scoreSpeech(sp); } }, "Score with Claude (about 0.3 cents)"),
        h("button", { disabled: !!S.busy, onclick: async () => { await saveSpeech(sp, null); renderSpeak(); } }, "Save without scoring"),
        h("button", { class: "ghost", onclick: abandonSpeak }, "Discard")));
  }
  out.push(card);
  // history
  if (S.speeches.length) out.push(h("div", { class: "card" }, h("h3", { text: "Your talks · " + S.speeches.length }), S.speeches.slice(0, 15).map(x => h("details", null,
    h("summary", null, fmtDate(x.createdAt) + " · L" + x.level + " · " + TYPE_LABEL[x.type] + " · " + x.topic.t + (x.score ? " · " + x.score.overall + "/5" : " · not scored")),
    x.metrics ? h("p", { class: "small muted num", text: mmss(x.metrics.seconds) + ", " + x.metrics.wpm + " wpm, " + x.metrics.fillerCount + " fillers, pitch range " + (x.metrics.pitchRange ?? "n/a") + " st" }) : null,
    x.score ? speechResult(x.score) : h("button", { disabled: !!S.busy, onclick: () => scoreSpeech(null, x) }, "Score it now (about 0.3 cents)"),
    x.recordingId ? h("p", { class: "small" }, h("a", { href: "#film", onclick: e => { e.preventDefault(); setView("film"); } }, "Watch it back in Film"), " with the three-pass review.") : null))));
  // frameworks
  out.push(h("details", { class: "card fold" }, h("summary", null, h("span", { class: "fold-title", text: "The frameworks" })),
    h("p", { class: "small muted", text: "Match the structure to the question. Senior people in finance want the answer first, so every one of these leads with the point." }),
    Object.keys(FRAMEWORKS).map(k => frameworkCard(k))));
  out.push(warmupCard());
  v.replaceChildren(...out);
  if (sp?.phase === "speaking" && SP.cam?.stream && sp.mode === "video") { const pv = $("#speak-cam"); if (pv) { pv.srcObject = SP.cam.stream; pv.play().catch(() => {}); } }
}

/* ---------- Warm-up: siren, six emotions, tongue twisters ---------- */
const WU = { stream: null, meter: null, lo: null, hi: null, twister: null, listener: null, t0: 0, result: null };
async function sirenStart() {
  try { WU.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { flash("Microphone access was blocked."); return; }
  WU.lo = WU.hi = null;
  WU.meter = new media.VoiceMeter(WU.stream, s => {
    if (s.hz && s.db > -45) { WU.lo = WU.lo ? Math.min(WU.lo, s.hz) : s.hz; WU.hi = WU.hi ? Math.max(WU.hi, s.hz) : s.hz; }
    const el = $("#siren-read"); if (el) el.textContent = (s.hz ? s.hz + " Hz now" : "…") + (WU.lo ? " · range " + Math.round(12 * Math.log2(WU.hi / WU.lo) * 10) / 10 + " semitones (" + WU.lo + "-" + WU.hi + " Hz)" : "");
  });
  renderSpeak();
}
function sirenStop() { WU.meter?.stop(); WU.meter = null; WU.stream?.getTracks().forEach(t => t.stop()); WU.stream = null; renderSpeak(); }
function twisterGo(speed) {
  if (!media.canListen) { flash("Tongue-twister checking needs Chrome or Edge."); return; }
  WU.result = null; WU.t0 = Date.now(); WU.speed = speed;
  WU.listener = new media.Listener(fin => { const el = $("#tw-heard"); if (el) el.textContent = fin || "Listening…"; WU.heard = fin; });
  WU.heard = ""; WU.listener.start(); renderSpeak();
}
function twisterStop() {
  const l = WU.listener; WU.listener = null; l?.stop();
  setTimeout(() => { WU.result = { acc: media.twisterAccuracy(WU.twister, WU.heard || ""), secs: Math.round((Date.now() - WU.t0) / 100) / 10 - 0.4, speed: WU.speed }; renderSpeak(); }, 400);
}
function warmupCard() {
  if (!WU.twister) WU.twister = TWISTERS[Math.floor(Math.random() * TWISTERS.length)];
  return h("details", { class: "card fold", open: WU.meter || WU.listener || WU.result ? true : null }, h("summary", null, h("span", { class: "fold-title", text: "Daily warm-up (5 minutes)" })),
    h("p", { class: "small muted", text: "Based on Vinh Giang's drills. Do it standing, out loud, before a talk or a big call." }),
    h("h3", { text: "1. The siren" }),
    h("p", { class: "small", text: "Slide your voice from your lowest note up to your highest and back down, like a siren, for a minute or two. It widens your pitch range so you sound less monotone. The meter tracks the range you reach." }),
    h("div", { class: "row" }, WU.meter ? h("button", { class: "primary", onclick: sirenStop }, "Stop") : h("button", { class: "primary", onclick: sirenStart }, "Start the siren meter"), h("span", { class: "small num", id: "siren-read" }, WU.meter ? "Listening…" : "")),
    h("h3", { text: "2. Six emotions" }),
    h("p", { class: "small", text: "Say “Good morning, everyone” six times, once per emotion. Change your face first: Giang calls your face the remote control for your voice." }),
    h("div", { class: "row" }, EMOTIONS.map(e => h("span", { class: "tag", text: e }))),
    h("h3", { text: "3. Tongue twisters" }),
    h("p", { class: "small", text: "For clear pronunciation: say it slowly and perfectly first, then fast. The site checks how much it understood." }),
    h("blockquote", { text: WU.twister }),
    h("div", { class: "row" },
      WU.listener ? [h("button", { class: "primary", onclick: twisterStop }, "Done"), h("span", { class: "small", id: "tw-heard", text: "Listening…" })]
        : [h("button", { onclick: () => twisterGo("slow") }, "Slow round"), h("button", { onclick: () => twisterGo("fast") }, "Fast round"), h("button", { class: "ghost", onclick: () => { WU.twister = TWISTERS[(TWISTERS.indexOf(WU.twister) + 1) % TWISTERS.length]; WU.result = null; renderSpeak(); } }, "Next twister")]),
    WU.result ? h("p", { class: "small num" }, h("strong", { text: WU.result.acc + "% understood" }), " in " + Math.max(0, WU.result.secs).toFixed(1) + "s (" + WU.result.speed + " round)." + (WU.result.acc >= 90 ? " Clean." : " Slow down and over-pronounce each word.")) : null);
}

/* ---------- Learn: lessons with free on-device drills ---------- */
const LN = { listener: null, timer: null, t0: 0 };
const learnProg = id => S.learn[id] || { attempts: 0, best: null, done: false, history: [] };
const lessonById = id => LESSONS.find(l => l.id === id);
const STOP = new Set(["the", "a", "an", "and", "or", "but", "i", "i'm", "my", "we", "we're", "you", "it", "it's", "to", "of", "in", "on", "for", "at", "is", "was", "just", "so", "this", "that", "with", "got", "get", "from", "last", "next", "week", "lot", "about", "been", "have", "had", "back", "really"]);
const normWords = t => String(t).toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);
function hasQuestion(t) {
  const s = String(t).toLowerCase();
  return s.includes("?") || /\b(how|what|where|when|why|who|which)\b/.test(s) || /\b(do|did|are|have|were|is|was|would|could|can|will)\s+(you|it|they|we|he|she)\b/.test(s) || /\b(and|how about|what about)\s+you\b/.test(s);
}
function countPhrases(t, list) { const s = " " + normWords(t).join(" ") + " "; return list.reduce((a, p) => a + (s.split(" " + p + " ").length - 1), 0); }
function fillerCount(t) { return countPhrases(t, FILLERS); }
async function saveLearn(id, score, passNow) {
  const p = learnProg(id);
  const best = p.best == null ? score : Math.max(p.best, score);
  S.learn = { ...S.learn, [id]: { attempts: p.attempts + 1, best, done: p.done || passNow, history: [...(p.history || []), { at: new Date().toISOString(), score }].slice(-20), last: new Date().toISOString() } };
  await db.kvSet("learn", S.learn);
}
async function setFocus(id) {
  S.learnFocus = id ? { id, left: 3 } : null;
  await db.kvSet("learnFocus", S.learnFocus);
  flash(id ? "Your next 3 conversation reps will practice “" + lessonById(id).title + "”, and the debrief will check it." : "Practice focus cleared.");
  renderLearn();
}
function nextLesson() { return LESSONS.find(l => !learnProg(l.id).done && l.id !== "F6") || null; }

function openLesson(id) { stopLearnAudio(); S.learnOpen = id; S.drill2 = null; setView("learn"); window.scrollTo(0, 0); }
function stopLearnAudio() { if (LN.listener) { LN.listener.stop(); LN.listener = null; } clearInterval(LN.timer); media.stopSpeaking(); stopMic(); }

// --- engine: say (spoken items) ---
function sayDrillState(lesson) { return { kind: "say", items: lesson.drill.items.map(it => ({ ...it, said: "", ok: null, why: "" })) }; }
function checkSay(lesson, it) {
  const d = lesson.drill, said = it.said.trim();
  if (!said) { it.ok = null; return; }
  if (d.mode === "repeat") { const acc = media.twisterAccuracy(it.target, said); it.ok = acc >= 80; it.why = acc + "% matched" + (it.ok ? "" : ". Say it again, a little slower."); return; }
  const n = normWords(said).length, q = hasQuestion(said);
  if (d.mode === "reply") {
    const reasons = [];
    if (n < d.minWords) reasons.push("a bit short; add one detail");
    if (n > d.maxWords) reasons.push("too long for small talk");
    if (d.needQuestion && !q) reasons.push("no question back");
    it.ok = !reasons.length; it.why = it.ok ? n + " words, with a question back. Nice." : "Close: " + reasons.join(", ") + "."; return;
  }
  if (d.mode === "followup") {
    const theirs = new Set(normWords(it.prompt).filter(w => w.length > 3 && !STOP.has(w)));
    const reused = normWords(said).filter(w => theirs.has(w) || [...theirs].some(t => t.slice(0, 5) === w.slice(0, 5) && w.length > 4));
    it.ok = q && reused.length > 0; it.why = !q ? "That's not a question yet." : !reused.length ? "It's a question, but it doesn't build on what they said." : "Builds on “" + reused[0] + "”. Good follow-up."; return;
  }
}
function sayDrillView(lesson, st) {
  const d = lesson.drill;
  const rows = st.items.map((it, i) => {
    const ta = h("textarea", { id: "ld-" + i, class: "short", placeholder: d.mode === "repeat" ? "Say it back" : "Your reply", oninput: e => { it.said = e.target.value; } }); ta.value = it.said;
    return h("div", { class: "drill-item" },
      h("div", { class: "row" }, h("button", { class: "pill", onclick: () => media.speak(it.prompt, voiceOpts()) }, "Play"), h("span", { class: d.mode === "repeat" ? "better" : "", text: d.mode === "repeat" || d.mode === "followup" ? it.prompt : "“" + it.prompt + "”" })),
      ta, h("div", { class: "row" }, micButton(ta, "Speak", () => { it.said = ta.value; checkSay(lesson, it); renderLearn(); }),
        h("button", { class: "pill", onclick: () => { it.said = ta.value; checkSay(lesson, it); renderLearn(); } }, "Check"),
        it.ok == null ? null : h("span", { class: "verdict " + (it.ok ? "right" : "wrong"), text: (it.ok ? "Pass. " : "") + it.why })));
  });
  const passed = st.items.filter(it => it.ok).length;
  return h("div", { class: "stack" }, rows,
    h("div", { class: "row" }, h("span", { class: "num", text: passed + " of " + st.items.length + " passed (need " + d.pass + ")" }),
      h("button", { class: "primary", onclick: async () => { const score = Math.round(5 * passed / st.items.length); await saveLearn(lesson.id, score, passed >= d.pass); flash(passed >= d.pass ? "Lesson complete." : "Saved. Keep going until " + d.pass + " pass."); renderLearn(); } }, "Finish drill")));
}

// --- engine: choose (multiple choice, then say it) ---
function chooseDrillState(lesson) { return { kind: "choose", checked: false, items: lesson.drill.items.map(it => ({ ...it, opts: shuffle(it.options.map((t, k) => ({ t, right: k === it.a }))), choice: null, said: "" })) }; }
function chooseDrillView(lesson, st) {
  const rows = st.items.map((it, n) => h("fieldset", { class: "mcq" },
    h("legend", null, h("button", { class: "pill", type: "button", onclick: () => media.speak(it.line, voiceOpts()) }, "Play"), " ", it.line),
    it.opts.map((o, k) => h("label", { class: st.checked ? (o.right ? "opt right" : k === it.choice ? "opt wrong" : "opt") : "opt" },
      h("input", { type: "radio", name: "lc-" + n, checked: it.choice === k, disabled: st.checked, onchange: () => { it.choice = k; } }), " ", o.t)),
    st.checked ? h("p", { class: "small muted", text: (it.opts[it.choice]?.right ? "Right. " : "Not quite. ") + it.why }) : null,
    st.checked ? (() => { const ta = h("textarea", { id: "lcs-" + n, class: "short", placeholder: "Now say the best line out loud, in your own words", oninput: e => { it.said = e.target.value; } }); ta.value = it.said; return [ta, h("div", { class: "row" }, micButton(ta))]; })() : null));
  const right = st.items.filter(it => it.opts[it.choice]?.right).length;
  return h("div", { class: "stack" }, rows,
    !st.checked ? h("div", { class: "row" }, h("button", { class: "primary", onclick: async () => {
      if (st.items.some(it => it.choice == null)) { flash("Pick an answer for each one."); return; }
      st.checked = true; const r = st.items.filter(it => it.opts[it.choice]?.right).length;
      await saveLearn(lesson.id, Math.round(5 * r / st.items.length), r >= lesson.drill.pass); renderLearn();
    } }, "Check my answers")) : h("p", { class: "levelup " + (right >= lesson.drill.pass ? "up" : ""), text: right + " of " + st.items.length + (right >= lesson.drill.pass ? ". Lesson complete." : ". Try again to finish the lesson.") }));
}

// --- engine: talk (timed spoken rounds) ---
function talkDrillState(lesson) {
  const ps = lesson.drill.prompts;
  return { kind: "talk", prompt: ps[Math.floor(Math.random() * ps.length)], short: false, round: 0, results: [], live: false, text: "", segs: [] };
}
function talkRounds(lesson, st) { return st.short && lesson.drill.shortRounds ? lesson.drill.shortRounds : lesson.drill.rounds; }
function startTalkRound(lesson, st) {
  if (!media.canListen) { flash("This drill needs speech recognition: use Chrome or Edge."); return; }
  const secs = talkRounds(lesson, st)[st.round];
  st.live = true; st.text = ""; st.segs = []; LN.t0 = Date.now();
  LN.listener = new media.Listener((fin, interim, segs) => { st.text = fin; st.segs = segs; const el = $("#talk-tx"); if (el) el.textContent = (fin + (interim ? " " + interim : "")).trim() || "Listening…";
    const fc = $("#talk-fillers"); if (fc && lesson.drill.fillerTarget) fc.textContent = fillerCount(fin) + " fillers"; });
  LN.listener.start();
  LN.timer = setInterval(() => { const el = (Date.now() - LN.t0) / 1000; const c = $("#talk-time"); if (c) c.textContent = mmss(secs - el); if (el >= secs) stopTalkRound(lesson, st); }, 250);
  renderLearn();
}
function stopTalkRound(lesson, st) {
  clearInterval(LN.timer); const l = LN.listener; LN.listener = null; l?.stop();
  setTimeout(async () => {
    const d = lesson.drill, secs = Math.max(1, (Date.now() - LN.t0) / 1000 - 0.35), text = st.text;
    const words = normWords(text).length, wpm = Math.round(words / (secs / 60));
    const ts = st.segs.map(s => s.t); let stalls = 0; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > 3) stalls++;
    if (ts.length && ts[0] > 4) stalls++;
    const fillers = fillerCount(text), fpm = Math.round(fillers / (secs / 60) * 10) / 10;
    const banned = d.banned && st.prompt.banned ? countPhrases(text, [st.prompt.banned.toLowerCase()]) + countPhrases(text, [st.prompt.banned.toLowerCase() + "s"]) : 0;
    const stallsUsed = d.stall ? countPhrases(text, STALL_PHRASES) : 0;
    st.results.push({ secs: Math.round(secs), words, wpm, stalls, fillers, fpm, banned, stallsUsed, text });
    st.live = false; st.round++;
    if (st.round >= talkRounds(lesson, st).length) await scoreTalk(lesson, st);
    renderLearn();
  }, 400);
}
async function scoreTalk(lesson, st) {
  const d = lesson.drill, r = st.results, last = r.at(-1);
  let score, note;
  if (d.banned) { score = clamp(5 - (last.banned ? 2 : 0) - Math.max(0, last.stalls - 1) - (last.words < 50 ? 1 : 0), 1, 5); note = (last.banned ? "You said the banned word " + last.banned + " time(s). " : "You never said the banned word. ") + last.stalls + " stall(s) over 3 seconds, " + last.words + " words."; }
  else if (d.stall) { score = clamp(2 * Math.min(last.stallsUsed, 2) + (last.fpm <= 3 ? 1 : 0), 1, 5); note = last.stallsUsed + " stall phrase(s) used, " + last.fpm + " fillers per minute."; }
  else if (d.fillerTarget) { score = last.fpm <= 2 ? 5 : last.fpm <= 3 ? 4 : last.fpm <= 4 ? 3 : last.fpm <= 6 ? 2 : 1; note = last.fpm + " fillers per minute (target under " + d.fillerTarget + ")."; }
  else if (d.fourThreeTwo) { const gain = r[0].wpm ? Math.round(100 * (r[2].wpm - r[0].wpm) / r[0].wpm) : 0; score = gain > 0 ? 5 : 3; note = "Words per minute: " + r.map(x => x.wpm).join(" → ") + " (" + (gain >= 0 ? "+" : "") + gain + "% from round 1 to 3)."; }
  else if (d.story) { score = last.secs <= 25 && last.words >= 30 ? 5 : last.secs <= 30 ? 4 : 3; note = "Round 1: " + r[0].secs + "s, " + r[0].words + " words. Round 2: " + last.secs + "s, " + last.words + " words."; }
  else { score = 3; note = ""; }
  const planned = talkRounds(lesson, st).at(-1);
  if (d.fourThreeTwo && r.some((x, i) => x.secs < talkRounds(lesson, st)[i] * 0.6)) { score = Math.min(score, 2); note = "Use most of each round's time so the speed-up means something. " + note; }
  else if ((d.banned || d.stall || d.fillerTarget) && last.secs < planned * 0.6) { score = Math.min(score, 2); note = "You stopped at " + last.secs + "s. Keep going for most of the " + mmss(planned) + " so it counts. " + note; }
  st.score = score; st.note = note;
  await saveLearn(lesson.id, score, score >= d.pass);
}
function talkDrillView(lesson, st) {
  const d = lesson.drill, rounds = talkRounds(lesson, st);
  const out = [h("blockquote", { text: st.prompt.text }),
    st.prompt.banned ? h("p", null, "Banned word: ", h("strong", { class: "banned", text: st.prompt.banned }), " (and its plural). Talk around it.") : null];
  if (d.shortRounds && st.round === 0 && !st.live) out.push(h("label", { class: "toggle" }, h("input", { type: "checkbox", checked: st.short, onchange: e => { st.short = e.target.checked; renderLearn(); } }), " Short version (" + d.shortRounds.map(mmss).join(", ") + ")"));
  if (rounds.length > 1) out.push(h("ol", { class: "cues" }, rounds.map((s, i) => h("li", { class: i === st.round && st.round < rounds.length ? "now" : "", text: "Round " + (i + 1) + ": " + mmss(s) }))));
  st.results.forEach((x, i) => out.push(h("p", { class: "small num", text: "Round " + (i + 1) + ": " + x.secs + "s, " + x.words + " words, " + x.wpm + " wpm, " + x.fillers + " fillers" + (d.banned ? ", " + x.stalls + " long stalls" : "") + (d.stall ? ", " + x.stallsUsed + " stall phrases" : "") })));
  if (st.live) out.push(h("div", { class: "spread" }, h("span", { class: "recdot static", text: "Listening" }), h("span", { class: "clock num", id: "talk-time", text: mmss(rounds[st.round]) })),
    d.fillerTarget ? h("p", { class: "small num", id: "talk-fillers", text: "0 fillers" }) : null,
    h("p", { class: "live-tx", id: "talk-tx", text: "Listening…" }), h("div", { class: "row" }, h("button", { class: "primary", onclick: () => stopTalkRound(lesson, st) }, "Stop")));
  else if (st.round < rounds.length) out.push(h("div", { class: "row" }, h("button", { class: "primary", onclick: () => startTalkRound(lesson, st) }, st.round === 0 ? "Start (" + mmss(rounds[0]) + ")" : "Start round " + (st.round + 1) + " (" + mmss(rounds[st.round]) + ")"),
    st.round === 0 ? h("button", { class: "ghost", onclick: () => { S.drill2 = talkDrillState(lesson); renderLearn(); } }, "Another prompt") : null));
  else {
    const fillerText = st.results.at(-1)?.text || "";
    out.push(h("p", { class: "levelup " + (st.score >= d.pass ? "up" : ""), text: st.score + " of 5" + (st.score >= d.pass ? ". Lesson complete." : ". Try again.") }), h("p", { text: st.note }),
      fillerText ? h("details", null, h("summary", null, "Your transcript, fillers in red"), h("div", { class: "txview" }, fillerMarkup(fillerText))) : null,
      h("div", { class: "row" }, h("button", { onclick: () => { S.drill2 = talkDrillState(lesson); renderLearn(); } }, "Go again with a new prompt")));
  }
  return h("div", { class: "stack" }, out);
}

function renderLearn() {
  const v = $("#v-learn"); if (!v || S.view !== "learn") return;
  const lesson = S.learnOpen ? lessonById(S.learnOpen) : null;
  if (lesson) {
    if (!S.drill2) S.drill2 = lesson.drill.engine === "say" ? sayDrillState(lesson) : lesson.drill.engine === "choose" ? chooseDrillState(lesson) : talkDrillState(lesson);
    const p = learnProg(lesson.id), focus = S.learnFocus?.id === lesson.id;
    v.replaceChildren(
      h("div", { class: "row" }, h("button", { class: "ghost", onclick: () => { stopLearnAudio(); S.learnOpen = null; S.drill2 = null; renderLearn(); } }, "← All lessons")),
      h("article", { class: "card lead" },
        h("span", { class: "eyebrow", text: (lesson.track === "fluency" ? "Fluency" : "Conversation") + " · Lesson " + lesson.id + (p.done ? " · complete" : "") }),
        h("h2", { class: "display", text: lesson.title }),
        lesson.idea.map(t => h("p", { text: t })),
        lesson.examples.length ? h("div", { class: "stack" }, h("h3", { text: "Hear it" }), lesson.examples.map(e => h("div", { class: "row" }, h("button", { class: "pill", onclick: () => media.speak(e.replace(/^(They|You): /, ""), voiceOpts()) }, "Play"), h("span", { text: e })))) : null,
        h("p", { class: "small source" }, h("strong", { text: "Source: " }), lesson.source, h("br"), h("strong", { text: "Evidence: " }), lesson.evidence)),
      h("article", { class: "card" }, h("h3", { text: "Drill it" }), h("p", { class: "small muted", text: lesson.drill.intro + " Free: no Claude calls." }),
        S.drill2.kind === "say" ? sayDrillView(lesson, S.drill2) : S.drill2.kind === "choose" ? chooseDrillView(lesson, S.drill2) : talkDrillView(lesson, S.drill2)),
      h("article", { class: "card" }, h("h3", { text: "Use it" }),
        h("p", { text: "Practice it in real conversation: " + lesson.useIt }),
        h("div", { class: "row" }, focus ? [h("span", { class: "tag good", text: "Active: " + S.learnFocus.left + " reps left" }), h("button", { class: "ghost", onclick: () => setFocus(null) }, "Stop practicing this")]
          : h("button", { class: "primary", onclick: () => setFocus(lesson.id) }, "Practice it in my next 3 reps")),
        h("p", { class: "small muted", text: "The scenario will give you chances to use it, and the debrief will tell you whether you did." })));
    return;
  }
  const done = LESSONS.filter(l => learnProg(l.id).done).length, nl = nextLesson();
  const list = track => LESSONS.filter(l => l.track === track).map(l => {
    const p = learnProg(l.id);
    return h("button", { class: "lesson-row", onclick: () => openLesson(l.id) },
      h("span", { class: "lid num", text: l.id }), h("span", { class: "ltitle", text: l.title + (l.id === "F6" ? " (optional)" : "") }),
      h("span", { class: "tag " + (p.done ? "good" : p.attempts ? "accent" : ""), text: p.done ? "Done" : p.attempts ? "Practiced" : "New" }));
  });
  v.replaceChildren(
    h("header", { class: "section-head" }, h("h2", { class: "display", text: "Learn" }),
      h("p", { class: "muted", text: "Short lessons built on research and proven teaching methods. Each one: the idea, examples you can hear, a free spoken drill, then you use it in your next conversation reps." }),
      h("p", { class: "small num", text: done + " of " + LESSONS.length + " lessons complete" + (S.learnFocus ? " · practicing “" + lessonById(S.learnFocus.id).title + "” (" + S.learnFocus.left + " reps left)" : "") })),
    nl ? h("article", { class: "card lead" }, h("span", { class: "eyebrow", text: "Up next" }), h("h3", { text: nl.id + ". " + nl.title }), h("p", { class: "small", text: nl.idea[0] }),
      h("div", { class: "row" }, h("button", { class: "primary", onclick: () => openLesson(nl.id) }, "Start lesson"))) : null,
    h("article", { class: "card" }, h("h3", { text: "Fluency: when the words won't come" }), h("div", { class: "lesson-list" }, list("fluency"))),
    h("article", { class: "card" }, h("h3", { text: "Conversation: what to say next" }), h("div", { class: "lesson-list" }, list("conversation"))));
}

/* ---------- Boot ---------- */
for (const a of document.querySelectorAll("nav.tabs a")) a.addEventListener("click", e => { e.preventDefault(); setView(a.dataset.v); });
window.addEventListener("hashchange", () => setView(location.hash.slice(1)));
if (media.canSpeak) speechSynthesis.onvoiceschanged = () => { if (S.view === "settings") renderSettings(); };
navigator.storage?.persist?.().catch(() => {});
loadAll().then(() => setView(location.hash.slice(1) || "today")).catch(e => { $("#status").textContent = "This browser blocked local storage, so the app can't save anything. Turn off private browsing and reload."; console.error(e); });
