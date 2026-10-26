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
  async open(previewEl) {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: true });
    if (previewEl) { previewEl.srcObject = this.stream; previewEl.muted = true; await previewEl.play().catch(() => {}); }
  }
  start() {
    const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(t => MediaRecorder.isTypeSupported(t)) || "";
    this.mime = type.split(";")[0] || "video/webm";
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
