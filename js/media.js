// Browser speech recognition, speech synthesis and camera recording.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!SR;
export const canSpeak = "speechSynthesis" in window;
export const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// Continuous dictation. onUpdate(finalText, interimText, segments) fires as words come in.
// segments are [{t: seconds since start, text}] for transcripts tied to a video.
export class Listener {
  constructor(onUpdate) { this.onUpdate = onUpdate; this.final = ""; this.segments = []; this.active = false; this.t0 = 0; }
  start() {
    if (!SR) return false;
    this.active = true; this.t0 = performance.now();
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const text = r[0].transcript.trim();
          if (text) { this.final = (this.final + " " + text).trim(); this.segments.push({ t: Math.round((performance.now() - this.t0) / 100) / 10, text }); }
        } else interim += r[0].transcript;
      }
      this.onUpdate(this.final, interim.trim(), this.segments);
    };
    rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { this.active = false; this.onUpdate(this.final, "", this.segments, "Microphone access was blocked. Allow it in the browser's site settings."); } };
    // Chrome ends recognition after a pause; keep it going until stop() is called.
    rec.onend = () => { if (this.active) { try { rec.start(); } catch { /* already restarting */ } } };
    this.rec = rec;
    try { rec.start(); } catch { return false; }
    return true;
  }
  stop() { this.active = false; try { this.rec?.stop(); } catch { /* not running */ } return this.final; }
}

export function voices() {
  if (!canSpeak) return [];
  return speechSynthesis.getVoices().filter(v => v.lang?.startsWith("en"));
}
let speaking = null;
export function speak(text, { voiceName, rate = 1 } = {}) {
  if (!canSpeak) return Promise.resolve();
  stopSpeaking();
  // Drop stage directions and "Name:" speaker labels before reading aloud.
  const clean = text.replace(/\*[^*]*\*/g, " ").replace(/^\s*[A-Z][\w.'-]*( [A-Z][\w.'-]*)?:\s*/gm, "").replace(/\s+/g, " ").trim();
  if (!clean) return Promise.resolve();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(clean);
    const v = voices().find(x => x.name === voiceName) || voices().find(x => x.lang === "en-US");
    if (v) u.voice = v;
    u.rate = rate; u.onend = u.onerror = () => { speaking = null; resolve(); };
    speaking = u; speechSynthesis.speak(u);
  });
}
export function stopSpeaking() { if (canSpeak) speechSynthesis.cancel(); speaking = null; }

// Camera + mic recording to WebM (or MP4 where WebM is unsupported, e.g. Safari).
export class Camera {
  async open(previewEl, { video = true } = {}) {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false, audio: true });
    this.audioOnly = !video;
    if (previewEl) { previewEl.srcObject = this.stream; previewEl.muted = true; await previewEl.play().catch(() => {}); }
  }
  start() {
    const kinds = this.audioOnly ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    const type = kinds.find(t => MediaRecorder.isTypeSupported(t)) || "";
    this.mime = type.split(";")[0] || (this.audioOnly ? "audio/webm" : "video/webm");
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream, type ? { mimeType: type, videoBitsPerSecond: 1_500_000 } : undefined);
    this.rec.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.startedAt = Date.now();
    this.rec.start(1000);
  }
  stop() {
    return new Promise(resolve => {
      if (!this.rec || this.rec.state === "inactive") return resolve(null);
      this.rec.onstop = () => resolve({ blob: new Blob(this.chunks, { type: this.mime }), seconds: Math.round((Date.now() - this.startedAt) / 1000), mime: this.mime });
      this.rec.stop();
    });
  }
  close() { this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; }
}

// Live voice meter on a mic stream: loudness (dBFS) and pitch (Hz) every 100 ms.
// Runs entirely in the browser. Pitch uses autocorrelation on the raw waveform.
export class VoiceMeter {
  constructor(stream, onSample) {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.src = this.ctx.createMediaStreamSource(stream);
    this.an = this.ctx.createAnalyser(); this.an.fftSize = 2048;
    this.src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.samples = []; this.t0 = performance.now(); this.onSample = onSample;
    this.timer = setInterval(() => this.tick(), 100);
  }
  tick() {
    this.an.getFloatTimeDomainData(this.buf);
    let sum = 0; for (const v of this.buf) sum += v * v;
    const rms = Math.sqrt(sum / this.buf.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    const hz = rms > 0.01 ? pitchOf(this.buf, this.ctx.sampleRate) : null;
    const s = { t: Math.round(performance.now() - this.t0) / 1000, db: Math.round(db * 10) / 10, hz: hz ? Math.round(hz) : null };
    this.samples.push(s); this.onSample?.(s);
  }
  stop() { clearInterval(this.timer); try { this.src.disconnect(); this.ctx.close(); } catch { /* already closed */ } return this.samples; }
}
function pitchOf(buf, rate) {
  // Autocorrelation over 70-400 Hz, the range of speaking voices.
  const n = buf.length, minLag = Math.floor(rate / 400), maxLag = Math.floor(rate / 70);
  let best = -1, bestLag = 0, c0 = 0;
  for (let i = 0; i < n; i++) c0 += buf[i] * buf[i];
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0; for (let i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag];
    if (c > best) { best = c; bestLag = lag; }
  }
  if (!bestLag || best / c0 < 0.5) return null;
  return rate / bestLag;
}
const pct = (arr, p) => { if (!arr.length) return null; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * (a.length - 1)))]; };
const std = arr => { if (arr.length < 2) return 0; const m = arr.reduce((a, b) => a + b, 0) / arr.length; return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length); };

// Summarize a recording's samples. Thresholds are rough and meant for trends, not lab accuracy.
export function analyzeVoice(samples, transcript, seconds, fillerList) {
  const dbs = samples.map(s => s.db);
  // Speech sits well above room noise (browsers apply noise suppression), so gate 30 dB under the loud end.
  const peak = pct(dbs, 0.95) ?? -20;
  const gate = Math.max(peak - 30, -65);
  const voiced = samples.filter(s => s.db > gate);
  const first = voiced[0]?.t ?? 0, last = voiced.at(-1)?.t ?? seconds;
  // pauses: silent stretches of 0.5 s or more between the first and last spoken moments
  const pauses = []; let run = 0;
  for (const s of samples) {
    if (s.t < first || s.t > last) continue;
    if (s.db <= gate) run += 0.1; else { if (run >= 0.5) pauses.push(Math.round(run * 10) / 10); run = 0; }
  }
  const pitched = voiced.map(s => s.hz).filter(Boolean);
  const lo = pct(pitched, 0.1), hi = pct(pitched, 0.9);
  const words = (String(transcript).trim().match(/\S+/g) || []).length;
  const talkMin = Math.max((last - first) / 60, 0.1);
  const lower = " " + String(transcript).toLowerCase().replace(/[^a-z' ]+/g, " ") + " ";
  const fillers = {};
  for (const f of fillerList) { const m = lower.split(" " + f + " ").length - 1; if (m) fillers[f] = m; }
  const fillerCount = Object.values(fillers).reduce((a, b) => a + b, 0);
  return {
    seconds: Math.round(seconds), wpm: Math.round(words / talkMin), words,
    volumeVariety: Math.round(std(voiced.map(s => s.db)) * 10) / 10,
    pitchRange: lo && hi ? Math.round(12 * Math.log2(hi / lo) * 10) / 10 : null,
    medianPitch: pitched.length ? Math.round(pct(pitched, 0.5)) : null,
    pauses: pauses.length, longestPause: pauses.length ? Math.max(...pauses) : 0,
    pausesPerMin: Math.round(pauses.length / talkMin * 10) / 10,
    fillers, fillerCount, fillersPerMin: Math.round(fillerCount / talkMin * 10) / 10,
    voicedShare: samples.length ? Math.round(100 * voiced.length / samples.length) : 0
  };
}
// Word-level similarity for tongue twisters: share of target words said, in order.
export function twisterAccuracy(target, said) {
  const norm = s => String(s).toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);
  const a = norm(target), b = norm(said);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return a.length ? Math.round(100 * dp[a.length][b.length] / Math.max(a.length, b.length)) : 0;
}
