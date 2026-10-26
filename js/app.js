import * as db from "./store.js";
import * as ai from "./ai.js";
import * as media from "./media.js";
import { SKILLS, LEVELS, DEPTH, SETTINGS, KIND, TOPICS, KNOW_COLD } from "./curriculum.js";

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
  profile: null, plans: [], sessions: [], phrases: [], recordings: [], knowCold: {},
  live: null, busy: "", flash: "", view: "today", quiz: null, drill: null, lookup: null, ctl: null
};
const VIEWS = ["today", "cold", "film", "plan", "progress", "phrases", "settings"];

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
  const [kv, plans, sessions, phrases, recordings] = await Promise.all([db.all("kv"), db.all("plans"), db.all("sessions"), db.all("phrases"), db.all("recordings")]);
  const kvm = Object.fromEntries(kv.map(r => [r.id, r.value]));
  S.settings = { ...S.settings, ...(kvm.settings || {}), apiKey: kvm.apiKey || "" };
  S.profile = kvm.profile || null;
  S.knowCold = kvm.knowCold || {};
  const byNew = (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
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
    partner_level_override: null, override_until: null, sessions_per_week: 4,
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
    used_phrase: orNull("boolean"), topic_comfort: { type: "integer" }, next_time: { type: "string" } }),
  plan: obj({ headline: { type: "string" }, focus_skills: strList, topics: strList, setting: { type: "string", enum: ["one_on_one", "group", "event", "mixed"] },
    partner_level_override: nullableInt, override_until: orNull("string"), sessions_per_week: { type: "integer" }, notes: strList,
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
    topic_comfort: clamp(d?.topic_comfort || 3, 1, 5), next_time: String(d?.next_time || "")
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
${recent.length ? "- Do not repeat these recent scenarios: " + recent.join("; ") : ""}
Place it in a realistic moment from the learner's own life as described above (work, school, recruiting coffee chats, team dinners, events). Use invented names, never real people.
Do not invent specific recent scores, trades, standings or news. The primer is evergreen facts plus how Americans usually talk about the topic, 3-4 short items.
The goal must make the learner practice the target skill specifically. "try" holds 3 lines or questions the learner could use. "others" is empty unless the setting has more than two people. "turns" is how many exchanges, 6-12.`, SCHEMA.scenario);
    const sc = {
      title: String(r.title || "Today's rep").slice(0, 90), situation: String(r.situation || ""),
      partner: { name: String(r.partner?.name || "Alex"), role: String(r.partner?.role || "a colleague"), vibe: String(r.partner?.vibe || "") },
      others: (r.others || []).filter(o => o?.name).slice(0, 2), goal: String(r.goal || SKILLS[next.skill].desc),
      opener: String(r.opener || "Hey, how's it going?"), primer: strArr(r.primer, 5), try: strArr(r.try, 4), turns: clamp(r.turns || 8, 5, 12)
    };
    S.live = { phase: "chat", next, scenario: sc, turns: [{ who: "them", text: sc.opener, at: Date.now() }], ended: false, startedAt: new Date().toISOString() };
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
Give 2-4 rewrites ("said" must quote the learner exactly), favoring lines that sound translated or moves they missed. Give 1-3 phrases worth learning for this topic. topic_comfort is 1-5. next_time is one concrete thing to try next session.`, SCHEMA.debrief), L.next.skill);
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
Request: ${ask}
Rules: focus_skills holds 1-3 keys from [${Object.keys(SKILLS).join(", ")}], usually the weakest unless the learner asked otherwise. topics holds 2-5 keys from [${Object.keys(TOPICS).join(", ")}]. partner_level_override is null, or 1-6 only when the learner asked to jump to or hold a level; override_until is YYYY-MM-DD or null. sessions_per_week is 3-7, lighter when the learner says a week is heavy. Keep anything the learner did not ask to change. Every change needs a reason a person would accept, citing evidence from the reps or the calendar. notes holds 2-4 short coaching notes.`, SCHEMA.plan);
    const doc = {
      id: db.uid("plan"), createdAt: new Date().toISOString(), source: mode === "weekly" ? "Weekly review" : "Your request", request: request || null,
      headline: String(r.headline || "This week's plan").slice(0, 160), focus_skills: strArr(r.focus_skills, 3).filter(k => SKILLS[k]),
      topics: strArr(r.topics, 5).filter(k => TOPICS[k]), setting: r.setting || "mixed",
      partner_level_override: r.partner_level_override ? clamp(r.partner_level_override, 1, 6) : null,
      override_until: /^\d{4}-\d{2}-\d{2}$/.test(r.override_until || "") ? r.override_until : null,
      sessions_per_week: clamp(r.sessions_per_week || 5, 3, 7), notes: strArr(r.notes, 4),
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
function startQuiz(card) {
  if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
  return guard("quiz", async () => {
    const r = await ai.askJSON(`Write a 5-question quick quiz on "${card.title}" for someone learning American small talk.
Learner: ${learner()}
Base every question on these reference facts only:
${card.essentials.map(e => "- " + e).join("\n")}
Questions people ask: ${card.ask.join(" | ")}
Mix the kinds: 3 "fact" questions (recall a fact they'd need in conversation) and 2 "respond" questions (someone says a line about this topic, and the learner writes what they'd say back). "ideal" is a short model answer.`, SCHEMA.quiz, { effort: "low" });
    S.quiz = { key: card.key, questions: (r.questions || []).slice(0, 5), phase: "answer", results: null };
  });
}
function gradeQuiz(card, answers) {
  return guard("grade", async () => {
    const q = S.quiz;
    const r = await ai.askJSON(`Grade this small-talk quiz on "${card.title}". Be fair, not picky: spoken-style answers and spelling slips are fine, and a "respond" answer is right if it would work naturally in a real American conversation.
Reference facts: ${card.essentials.join(" ")}
${q.questions.map((x, i) => `Q${i + 1} (${x.kind}): ${x.q}\nModel answer: ${x.ideal}\nLearner's answer: ${answers[i] || "(blank)"}`).join("\n\n")}
Return one result per question in order. score is the number right, counting each "partly" as half and rounding down. tip is one sentence on what to review.`, SCHEMA.grade, { effort: "low" });
    q.results = r; q.answers = answers; q.phase = "done";
    const prev = S.knowCold[card.key] || { status: "new", scores: [] };
    const scores = [...(prev.scores || []), clamp(r.score, 0, 5)].slice(-6);
    const last2 = scores.slice(-2);
    const status = last2.length === 2 && last2.every(x => x >= 4) ? "cold" : "learning";
    S.knowCold = { ...S.knowCold, [card.key]: { status, scores, lastQuiz: new Date().toISOString() } };
    await db.kvSet("knowCold", S.knowCold);
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
"setup" says who is speaking and where (one sentence). "opener" is the line they say. "aim" says what a strong answer does. "include" lists 2-3 things to hit (for example a specific detail, a question back). "seconds" is the target length, 45-120.`, SCHEMA.drill, { effort: "low" });
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
${rec.skill ? "Target skill: " + rec.skill + ". Its score is required." : ""} Score other skills only where the transcript clearly shows them, else null. used_phrase is null. In "fix", include pacing advice if the pace is far outside the natural range. Give 2-4 rewrites quoting the learner exactly, and 1-3 phrases worth learning.`, SCHEMA.debrief), rec.skill || null);
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
  S.view = v;
  if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
  for (const a of document.querySelectorAll("nav.tabs a")) { if (a.dataset.v === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
  for (const sec of document.querySelectorAll("section.view")) sec.hidden = sec.id !== "v-" + v;
  render();
}
function render() {
  renderMini(); renderStatus();
  ({ today: renderToday, cold: renderCold, film: renderFilm, plan: renderPlan, progress: renderProgress, phrases: renderPhrases, settings: renderSettings })[S.view]();
}
function renderMini() {
  const p = prof();
  $("#mini").replaceChildren(...Object.entries(SKILLS).map(([k, v]) => h("span", null, v.short + " ", h("b", { text: p.skills[k].level }))));
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
        S.busy === "quiz" && !q ? h("span", { class: "thinking", text: "Writing your quiz" }) : h("button", { disabled: !!S.busy, onclick: () => startQuiz(c) }, q ? "New quiz" : "Quiz me")),
      q ? quizView(c, q) : null));
  }
  v.replaceChildren(...out);
}
function quizView(card, q) {
  if (q.phase === "answer") {
    const inputs = q.questions.map((x, i) => h("textarea", { id: "qa-" + i, class: "short", placeholder: x.kind === "respond" ? "What you'd say back" : "Your answer" }));
    return h("div", { class: "quiz" }, q.questions.map((x, i) => h("div", { class: "stack" }, h("p", null, h("strong", { text: (i + 1) + ". " }), x.q), inputs[i], h("div", { class: "row" }, micButton(inputs[i])))),
      h("div", { class: "row" }, S.busy === "grade" ? h("span", { class: "thinking", text: "Grading" }) : h("button", { class: "primary", onclick: () => { stopMic(); gradeQuiz(card, inputs.map(t => t.value.trim())); } }, "Check my answers")));
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
  const dl = h("a", { class: "btn ghost", download: "small-talk-" + r.createdAt.slice(0, 10) + "-" + slug(r.title).slice(0, 30) + (r.mime === "video/mp4" ? ".mp4" : ".webm") }, "Download video");
  const notes = h("textarea", { id: "notes-" + r.id, class: "short", placeholder: "Your own notes from watching it back: eye contact, pace, energy" }); notes.value = r.notes || "";
  const tx = h("textarea", { id: "tx-" + r.id, class: "short" }); tx.value = r.transcript || "";
  const card = h("details", { class: "card fold", ontoggle: async e => { if (e.target.open && !vid.src) { const u = await videoURL(r.id); if (u) { vid.src = u; dl.href = u; } else vid.replaceWith(h("p", { class: "notice", text: "The video file is missing from this browser." })); } } },
    h("summary", null, h("span", { class: "fold-title", text: r.title }), h("span", { class: "small muted num", text: fmtDate(r.createdAt) + " · " + fmtSecs(r.seconds || 0) }),
      r.debrief ? chip("Scored", "good") : chip(r.kind === "rep" ? "Rep video" : "Not scored")),
    vid, r.opener ? h("blockquote", { text: "“" + r.opener + "”" }) : null,
    h("label", { class: "eyebrow", for: tx.id, text: "Transcript" }), tx,
    h("label", { class: "eyebrow", for: notes.id, text: "Notes" }), notes,
    h("div", { class: "row" },
      h("button", { onclick: async () => { r.transcript = tx.value.trim(); r.notes = notes.value.trim(); await db.put("recordings", r); flash("Saved."); } }, "Save edits"),
      S.busy === "video-" + r.id ? h("span", { class: "thinking", text: "Scoring" }) : h("button", { class: "primary", disabled: !!S.busy, onclick: async () => { r.transcript = tx.value.trim(); r.notes = notes.value.trim(); await scoreRecording(r); } }, r.debrief ? "Score again" : "Score this recording"),
      dl,
      h("button", { class: "ghost danger", onclick: e => { if (!r._confirm) { r._confirm = true; e.currentTarget.textContent = "Tap again to delete"; return; } deleteRecording(r); } }, "Delete")),
    r.debrief ? h("div", { class: "stack" }, h("p", { class: "display-sm", text: r.debrief.headline }), r.debrief.wpm ? h("p", { class: "small muted num", text: "Pace: " + r.debrief.wpm + " words per minute (natural is about 130-170)" }) : null, debriefBlock(r.debrief)) : null);
  return card;
}

function renderPlan() {
  const v = $("#v-plan"), plan = currentPlan(), out = [];
  const ov = plan.partner_level_override;
  out.push(h("article", { class: "card lead" },
    h("div", { class: "spread" }, h("span", { class: "eyebrow", text: "Current plan · " + plan.source + " · " + fmtDate(plan.createdAt) }), h("span", { class: "small muted num", text: plan.sessions_per_week + " reps a week" })),
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
  out.push(h("article", { class: "card" }, h("h2", { class: "display", text: "The ladder" }), h("p", { class: "small muted", text: LEVELS.map(l => l.n + " " + l.name).join(" · ") }), lad));
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
  const go = () => { const ph = qIn.value.trim(); if (!ph) return; if (!ai.ready()) { setView("settings"); flash("Add your Anthropic API key first."); return; }
    guard("lookup", async () => { S.lookup = await ai.lookupPhrase(ph); }); };
  qIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
  const L = S.lookup;
  out.push(h("article", { class: "card lead" }, h("span", { class: "eyebrow", text: "Look it up" }),
    h("p", { class: "muted", text: "Searches the web for how Americans actually use a phrase, with sources." }),
    h("div", { class: "searchrow" }, qIn, S.busy === "lookup" ? h("span", { class: "thinking", text: "Searching" }) : h("button", { class: "primary", onclick: go, disabled: !!S.busy }, "Look it up")),
    L ? h("div", { class: "lookup" },
      h("div", { class: "spread" }, h("h3", { class: "display-sm", text: L.phrase }), chip(L.register || "", /avoid|slang/i.test(L.register || "") ? "bad" : "accent")),
      h("p", { text: L.meaning }), L.example ? h("p", { class: "example", text: "“" + L.example + "”" }) : null, L.notes ? h("p", { class: "small", text: L.notes }) : null,
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
          guard("test", async () => { const r = await ai.askJSON("Reply with ok set to true.", obj({ ok: { type: "boolean" } }), { effort: "low" }); S.flash = r.ok ? "Your key works." : "Unexpected reply."; }); } }, "Test key"))),
    h("article", { class: "card" }, h("h3", { text: "About you" }), about,
      h("div", { class: "row" }, h("button", { class: "primary", onclick: async () => { st.about = about.value.trim(); await saveSettings(); flash("Saved."); } }, "Save"))),
    h("article", { class: "card" }, h("h3", { text: "Voice" }),
      media.canSpeak ? [h("label", { class: "eyebrow", for: "voice", text: "Partner voice" }), voiceSel, h("label", { class: "eyebrow", for: "rate", text: "Speaking speed" }), rate,
        h("div", { class: "row" }, h("button", { onclick: () => media.speak("Hey, good to see you. How was your weekend?", { voiceName: voiceSel.value, rate: Number(rate.value) }) }, "Try it"),
          h("button", { class: "primary", onclick: async () => { st.voice = voiceSel.value; st.rate = Number(rate.value); await saveSettings(); flash("Saved."); } }, "Save"))]
        : h("p", { class: "small muted", text: "This browser can't read text aloud." }),
      h("p", { class: "small muted", text: media.canListen ? "Speech recognition is available here. In Chrome it's processed by Google's speech service." : "Speech recognition isn't available in this browser. Chrome or Edge adds it." })),
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

/* ---------- Boot ---------- */
for (const a of document.querySelectorAll("nav.tabs a")) a.addEventListener("click", e => { e.preventDefault(); setView(a.dataset.v); });
window.addEventListener("hashchange", () => setView(location.hash.slice(1)));
if (media.canSpeak) speechSynthesis.onvoiceschanged = () => { if (S.view === "settings") renderSettings(); };
navigator.storage?.persist?.().catch(() => {});
loadAll().then(() => setView(location.hash.slice(1) || "today")).catch(e => { $("#status").textContent = "This browser blocked local storage, so the app can't save anything. Turn off private browsing and reload."; console.error(e); });
