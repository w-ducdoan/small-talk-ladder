// Claude calls, made straight from the browser with the viewer's own API key.
import Anthropic from "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.133.0/+esm";

export const DEFAULT_MODEL = "claude-opus-5-5";
// Server-side refusal fallback: a declined request is re-run on a fallback model in the same call.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };

let client = null;
let model = DEFAULT_MODEL;

// Spend meter: estimate each call's cost from the token counts the API returns.
// Prices are USD per million tokens; web search is $10 per 1,000 searches.
const PRICES = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-haiku-5-5": [0.10, 0.50] };
let usageListener = null;
export const onUsage = fn => { usageListener = fn; };
function record(msg, feature) {
  const u = msg?.usage; if (!u || !usageListener) return;
  const [pin, pout] = PRICES[Object.keys(PRICES).find(k => String(msg.model || "").startsWith(k))] || PRICES[model] || [5, 25];
  const inTok = (u.input_tokens || 0) + 1.25 * (u.cache_creation_input_tokens || 0) + 0.1 * (u.cache_read_input_tokens || 0);
  const searches = u.server_tool_use?.web_search_requests || 0;
  const cost = (inTok * pin + (u.output_tokens || 0) * pout) / 1e6 + searches * 0.01;
  usageListener({ feature, cost, input: u.input_tokens || 0, output: u.output_tokens || 0, searches });
}

export function configure({ apiKey, modelId }) {
  client = apiKey ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 }) : null;
  model = modelId || DEFAULT_MODEL;
}
export const ready = () => !!client;

export function errorText(e) {
  if (e?.name === "AbortError" || e instanceof Anthropic.APIUserAbortError) return "";
  if (e instanceof Anthropic.AuthenticationError) return "Your API key was rejected. Check it in Settings.";
  if (e instanceof Anthropic.PermissionDeniedError) return "This API key isn't allowed to use that model. Pick another model in Settings.";
  if (e instanceof Anthropic.RateLimitError) return "Rate limit or spend limit reached on your API key. Wait a minute and try again.";
  if (e instanceof Anthropic.BadRequestError) return "Claude rejected the request: " + (e.error?.error?.message || e.message);
  if (e instanceof Anthropic.InternalServerError) return "Claude is overloaded right now. Try again in a moment.";
  if (e instanceof Anthropic.APIConnectionError) return "Couldn't reach Claude. Check your connection.";
  if (e?.code === "refusal") return "Claude declined that one. Try rewording it.";
  return e?.message || "Something went wrong talking to Claude.";
}

function textOf(msg) {
  if (msg.stop_reason === "refusal") throw Object.assign(new Error("refused"), { code: "refusal" });
  return msg.content.filter(b => b.type === "text").map(b => b.text).join("");
}
function need() { if (!client) throw new Error("Add your Anthropic API key in Settings first."); }

// One request whose answer must match a JSON schema (structured outputs).
export async function askJSON(prompt, schema, { effort = "medium", signal, feature = "other" } = {}) {
  need();
  const msg = await client.beta.messages.create({
    model, max_tokens: 16000, ...FALLBACK,
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }]
  }, { signal });
  record(msg, feature);
  return JSON.parse(textOf(msg));
}

// Streamed roleplay turn. onText receives the whole reply so far.
export async function streamChat(system, messages, onText, { effort = "low", signal, feature = "rep" } = {}) {
  need();
  const stream = client.beta.messages.stream({
    model, max_tokens: 4000, ...FALLBACK, output_config: { effort }, system, messages
  }, { signal });
  stream.on("text", (_delta, snapshot) => onText(snapshot));
  const msg = await stream.finalMessage();
  record(msg, feature);
  return textOf(msg);
}

// Phrase explanation from Claude's own knowledge: no web search, so it costs a fraction of a cent.
export async function explainPhrase(phrase, { signal } = {}) {
  const S = { type: "string" };
  const out = await askJSON(`Explain the English phrase or idiom "${phrase}" the way an American professional would use it, from your own knowledge.
meaning: plain-English meaning in 1-2 sentences. register: one of casual, neutral, office-safe, formal, slang, avoid at work. example: one natural example sentence from a workplace or social setting. notes: one short usage note (who says it, tone, common mistakes, or close alternatives). If it's very new slang you're unsure about, say so in notes.`,
    { type: "object", properties: { phrase: S, meaning: S, register: S, example: S, notes: S }, required: ["phrase", "meaning", "register", "example", "notes"], additionalProperties: false },
    { effort: "low", signal, feature: "lookup" });
  return { ...out, sources: [], fromWeb: false };
}

// Phrase lookup with Claude's web search tool. Returns the parsed answer plus real source links.
export async function lookupPhrase(phrase, { signal } = {}) {
  need();
  const prompt = `Look up the English phrase or idiom "${phrase}" on the web, the way an American professional would use it.
Run one web search, then reply with only a JSON object, no other text:
{"phrase":"the phrase in its usual form","meaning":"plain-English meaning in 1-2 sentences","register":"casual | neutral | office-safe | formal | slang | avoid at work","example":"one natural example sentence from a workplace or social setting","notes":"one short usage note: who says it, tone, common mistakes, or close alternatives"}`;
  const messages = [{ role: "user", content: prompt }];
  let msg;
  for (let i = 0; i < 3; i++) {
    msg = await client.beta.messages.create({
      model, max_tokens: 8000, ...FALLBACK, output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 1 }], messages
    }, { signal });
    record(msg, "lookup");
    if (msg.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: msg.content });
  }
  const text = textOf(msg);
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The lookup came back without an answer. Try again.");
  const out = JSON.parse(text.slice(start, end + 1));
  const sources = [], seen = new Set();
  const add = (url, title) => { if (url && !seen.has(url) && sources.length < 4) { seen.add(url); sources.push({ url, title: title || url }); } };
  for (const b of msg.content) {
    if (b.type === "text") for (const c of b.citations || []) add(c.url, c.title);
  }
  for (const b of msg.content) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) add(r.url, r.title);
  }
  return { ...out, sources, fromWeb: true };
}
