# Small Talk Ladder

Daily practice for American workplace small talk, built for people who speak English as a second language.

- **Roleplay partner.** Claude plays a colleague, a busy senior banker or a whole dinner table, and gets harder as you improve. There are six partner levels, from Friendly to High stakes.
- **Adaptive ladder.** Each skill has its own level: follow-up questions, turning it back, keeping a thread alive, bridging to business, graceful exits and natural phrasing. Three strong reps move a skill up, and two rough ones move it down.
- **Weekly plan.** Run a weekly review or type what you want ("lighter week", "more golf"), and the plan rewrites itself with reasons. Every version is kept.
- **Voice.** Speak your replies and hear the partner talk back, using the browser's speech recognition and voices (Chrome or Edge).
- **Film room.** Record yourself answering an opener on camera and get a live transcript. Then score it and watch it back.
- **Know Cold.** 17 topic cards (NFL, golf, Thanksgiving, New York life, markets talk and more), each with a quiz.
- **Phrase bank.** Look up any phrase with a web search, save it, and the app works it into future conversations.

## Privacy and cost

Everything you practice is stored in your own browser (IndexedDB): reps, plans, phrases, videos and your API key. The site has no server. Prompts go straight from your browser to the Anthropic API using your own key, so usage is billed to your Anthropic account. Setting a spend limit in the Anthropic Console is a good idea. Speech recognition in Chrome is processed by Google's speech service.

## Run locally

```bash
python -m http.server 5180
```

Then open http://localhost:5180. No build step.

## Files

| Path | What it is |
| :-- | :-- |
| `index.html`, `styles.css` | Page shell and styling |
| `js/app.js` | Adaptive engine, prompts and every view |
| `js/ai.js` | Claude calls through the official Anthropic SDK (loaded from jsDelivr) |
| `js/media.js` | Speech recognition, read-aloud voices and camera recording |
| `js/store.js` | IndexedDB storage, backup export and import |
| `js/curriculum.js` | Skills, partner levels, topics and the Know Cold cards |
