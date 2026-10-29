// Learn tab: 12 lessons in two tracks. Every drill runs on the device, so lessons cost nothing.
// Drill engines: "say" (spoken items checked by speech recognition), "choose" (multiple choice, then say it),
// "talk" (timed spoken rounds measured for pace, fillers, stalls and banned words).
// evidence: a one-line, honest read of how strong the support is.

export const STALL_PHRASES = ["how do i put this", "what's the word", "the word i'm looking for", "let me think", "how should i say", "let me put it this way", "it's like", "what i mean is", "you know what i mean", "give me a second", "that's a good question", "i'd say", "the way i see it"];
export const QUESTION_STARTS = ["how", "what", "where", "when", "why", "who", "which", "do you", "did you", "are you", "have you", "were you", "is it", "was it", "would you", "could you", "can you", "how about you", "what about you", "and you", "you"];

export const LESSONS = [
  // ---------------- Fluency track ----------------
  { id: "F1", track: "fluency", title: "Think in chunks",
    idea: [
      "Native speakers don't build sentences one word at a time. They pull whole phrases from memory, like “I'm leaning toward,” “to be honest,” or “the thing is.” That's a big reason they sound fast and smooth.",
      "If you translate word by word from your first language, every sentence becomes a construction project, and that's where the hesitation comes from. Learning phrases as single units removes most of the building work.",
      "The goal of this lesson is ten chunks you can say without thinking. Say each one out loud until it comes out as one smooth sound."
    ],
    source: "Pawley and Syder (1983), on native-like fluency; Michael Lewis, The Lexical Approach (1993).",
    evidence: "Well established in language teaching as a principle, more than one headline experiment.",
    examples: ["To be honest, I'm still figuring it out.", "The thing is, we're short on time.", "I'm leaning toward the second option.", "That makes a lot of sense.", "Now that you mention it, I did see that."],
    drill: { engine: "say", mode: "repeat", pass: 8, intro: "Tap Play, then tap Speak and say the phrase back smoothly. 80% recognized counts as a pass.",
      items: [
        { prompt: "To be honest, I'm still figuring it out.", target: "To be honest, I'm still figuring it out." },
        { prompt: "That makes a lot of sense.", target: "That makes a lot of sense." },
        { prompt: "I'm leaning toward the first one.", target: "I'm leaning toward the first one." },
        { prompt: "The thing is, it depends on timing.", target: "The thing is, it depends on timing." },
        { prompt: "Now that you mention it, yeah.", target: "Now that you mention it, yeah." },
        { prompt: "I'd be curious to hear what you think.", target: "I'd be curious to hear what you think." },
        { prompt: "It's been a crazy week, honestly.", target: "It's been a crazy week, honestly." },
        { prompt: "I hadn't thought about it that way.", target: "I hadn't thought about it that way." },
        { prompt: "Let me get back to you on that.", target: "Let me get back to you on that." },
        { prompt: "Fair enough. What made you decide that?", target: "Fair enough. What made you decide that?" }
      ] },
    useIt: "Use at least two natural chunks such as “to be honest,” “the thing is,” or “that makes sense” where they fit." },

  { id: "F2", track: "fluency", title: "Talk around the missing word",
    idea: [
      "Every speaker, native or not, sometimes reaches for a word and it isn't there. The difference is what happens next. Native speakers rarely stop. They describe the thing instead and keep going. Linguists call this circumlocution.",
      "If “negotiate” won't come, say “we're trying to agree on the price.” If “spreadsheet” disappears, say “the Excel file with all the numbers.” The listener understands, and the conversation never stalls.",
      "Useful templates: “It's the thing you use to...,” “It's like a ___, but ___,” “the kind of person who...,” “the opposite of ___.” In the Word Block drill, one key word is banned. Keep talking around it without long stops."
    ],
    source: "Z. Dörnyei (1995), “On the Teachability of Communication Strategies,” TESOL Quarterly 29(1).",
    evidence: "Good: a training study with 109 learners improved the use and quality of circumlocution. It's described as the most teachable strategy.",
    examples: ["It's the thing you use to charge your phone in the car.", "He's the kind of person who always reads the fine print.", "It's like a loan, but the company owes it back to investors.", "The opposite of a bear market. When everything's going up."],
    drill: { engine: "talk", rounds: [45], banned: true, pass: 3, intro: "Talk for 45 seconds about the prompt without saying the banned word. Pauses over 3 seconds count as stalls.",
      prompts: [
        { text: "Describe your morning routine.", banned: "coffee" }, { text: "Explain what a bank does.", banned: "money" }, { text: "Describe your favorite sport.", banned: "ball" },
        { text: "Talk about your phone and how you use it.", banned: "app" }, { text: "Explain how you get to school or work.", banned: "car" }, { text: "Describe a good restaurant you know.", banned: "food" },
        { text: "Explain what an internship is.", banned: "work" }, { text: "Describe the city you live in.", banned: "people" }, { text: "Talk about how you study for an exam.", banned: "notes" },
        { text: "Explain what the stock market is.", banned: "stock" }, { text: "Describe your last trip.", banned: "plane" }, { text: "Explain how a credit card works.", banned: "pay" }
      ] },
    useIt: "If a word doesn't come, describe it instead of stopping." },

  { id: "F3", track: "fluency", title: "Stall phrases that sound natural",
    idea: [
      "Everyone needs a second to think. “Um” and “uh” fill that second, but they make you sound unsure. Stall phrases fill the same second and sound thoughtful instead.",
      "Keep a small set ready: “How do I put this...,” “That's a good question,” “Let me think about that for a second,” “The way I see it...,” “What I mean is...” They buy you two or three seconds while your brain finds the sentence.",
      "Don't overuse any single one. Rotate two or three, and pair them with a real pause."
    ],
    source: "Dörnyei (1995): fillers and hesitation devices were one of the trained strategies.",
    evidence: "Good: trained learners used fillers and hesitation devices more, and more appropriately.",
    examples: ["That's a good question. I'd say it depends on the team.", "How do I put this... it's more of a culture thing.", "Let me think about that for a second. Probably the second one.", "The way I see it, it's worth the risk."],
    drill: { engine: "talk", rounds: [60], stall: true, pass: 3, intro: "Answer the question for 60 seconds. Use at least two stall phrases instead of “um.” The site counts both.",
      prompts: [
        { text: "What's the hardest decision you've made this year?" }, { text: "If you could change one thing about your school, what would it be?" }, { text: "What's something most people misunderstand about your field?" },
        { text: "Where do you see yourself in five years?" }, { text: "What would you do with an extra day every week?" }, { text: "What's a skill everyone should learn?" },
        { text: "What makes a good manager?" }, { text: "What's the best advice you've ever received?" }
      ] },
    useIt: "When you need a second, use a stall phrase like “that's a good question” instead of “um.”" },

  { id: "F4", track: "fluency", title: "The 4/3/2 drill",
    idea: [
      "Tell the same short talk three times, with less time each round: four minutes, then three, then two. Because the content is already in your head, each round trains your mouth to go faster with fewer hesitations.",
      "In Paul Nation's study, one speaker went from 86 to 127 words per minute across the three rounds, with fewer hesitations and false starts. Later studies found similar fluency gains.",
      "The honest caveat: researchers found the gains are mostly in speed, not grammar accuracy, and they need repetition over weeks to last. Do it once or twice a week on different topics. The short version runs 2:00, 1:30 and 1:00."
    ],
    source: "Maurice (1983); I. S. P. Nation (1989), System; later replications. Critique: Boers (2014).",
    evidence: "Good for speed and fewer hesitations; weaker for accuracy, and lasting effects need repeated practice.",
    examples: [],
    drill: { engine: "talk", rounds: [240, 180, 120], shortRounds: [120, 90, 60], fourThreeTwo: true, pass: 1, intro: "Same topic, three rounds, less time each round. The site shows your words per minute for each round.",
      prompts: [
        { text: "Tell the story of how you chose your major or career." }, { text: "Describe your hometown to someone who's never been." }, { text: "Explain a project you're proud of." },
        { text: "Tell the story of your first week in a new country or city." }, { text: "Describe your favorite hobby and how you got into it." }, { text: "Walk through a typical day at your job or school." }
      ] },
    useIt: "Answer smoothly, without restarting your sentences." },

  { id: "F5", track: "fluency", title: "Pause, don't fill",
    idea: [
      "A pause sounds confident. A filler sounds nervous. Vinh Giang calls silence the most important note in music: it lets your point land and gives you time to think.",
      "The habit to build: when you feel an “um” coming, close your mouth and breathe. A one-second pause feels long to you, but to the listener it sounds deliberate.",
      "In this drill the filler counter runs live. Try to get under two fillers per minute."
    ],
    source: "Vinh Giang's vocal foundations (pausing), from summaries of his talks.",
    evidence: "A respected coach's method rather than research, but it matches what research on listener perception generally finds.",
    examples: ["I think the answer is... the second option.", "There are two reasons. First... timing.", "Honestly? I'd do it again."],
    drill: { engine: "talk", rounds: [60], fillerTarget: 2, pass: 3, intro: "Talk for 60 seconds. When you feel a filler coming, pause instead. Aim for under 2 fillers per minute.",
      prompts: [
        { text: "Explain why you chose your current path." }, { text: "Describe the best meal you've ever had." }, { text: "What's a habit you're proud of?" },
        { text: "Explain something you learned this week." }, { text: "Describe someone you admire." }, { text: "Talk about a place you'd love to visit." }
      ] },
    useIt: "Pause instead of saying “um” or “like.”" },

  { id: "F6", track: "fluency", title: "Shadowing (optional)",
    idea: [
      "Shadowing means listening to a native line and repeating it right away, matching the rhythm, stress and melody, not just the words. Interpreters use it in training.",
      "It trains the music of English: which words get stressed, where voices go up and down, how words link together (“whaddaya think”).",
      "Honest note: the research here is weaker than for the other lessons. Most studies are small and lack proper control groups. It's here as an optional extra."
    ],
    source: "Interpreter training; several small EFL studies.",
    evidence: "Promising but unproven: mostly small studies without control groups.",
    examples: [],
    drill: { engine: "say", mode: "repeat", pass: 6, intro: "Play the line, then repeat it immediately, copying the rhythm. Play it again as often as you like.",
      items: [
        { prompt: "What do you think? Should we grab lunch?", target: "What do you think? Should we grab lunch?" },
        { prompt: "I'm not gonna lie, that was a long meeting.", target: "I'm not gonna lie, that was a long meeting." },
        { prompt: "Wait, are you serious? That's amazing.", target: "Wait, are you serious? That's amazing." },
        { prompt: "Let's circle back on this tomorrow morning.", target: "Let's circle back on this tomorrow morning." },
        { prompt: "I'll send it over in a couple of minutes.", target: "I'll send it over in a couple of minutes." },
        { prompt: "How was your weekend? Do anything fun?", target: "How was your weekend? Do anything fun?" },
        { prompt: "That's fair, but I see it a little differently.", target: "That's fair, but I see it a little differently." },
        { prompt: "Honestly, it could go either way.", target: "Honestly, it could go either way." }
      ] },
    useIt: "Match the natural rhythm of English: stress the important words, link the small ones." },

  // ---------------- Conversation track ----------------
  { id: "C1", track: "conversation", title: "Answer, add a detail, ask back",
    idea: [
      "Most small-talk questions want three things in one breath: a short answer, one specific detail, and the question back. “Good, thanks. I finally tried that ramen place on Fowler. How was yours?”",
      "The answer alone (“Good”) ends the conversation. The answer plus a detail gives them something to grab. The question back hands them the turn.",
      "Keep it short: about 10 to 30 words. Small talk is quick back-and-forth, not an interview answer."
    ],
    source: "A standard practitioner pattern; the question-back part is backed by Huang et al. (2017).",
    evidence: "The pattern is common practice; the value of asking questions is research-backed.",
    examples: ["Pretty good! Went to a friend's barbecue on Sunday. How about you?", "Busy, but good busy. We're closing a deal this week. How's yours going?", "Not yet, but it's on my list. Have you been?"],
    drill: { engine: "say", mode: "reply", minWords: 8, maxWords: 35, needQuestion: true, pass: 6, intro: "Hear the opener, then reply in one breath: answer, one detail, question back. 8-35 words, and it has to ask something back.",
      items: [
        { prompt: "Hey, how was your weekend?" }, { prompt: "Busy week?" }, { prompt: "Have you tried the new coffee place downstairs?" }, { prompt: "Any plans for Thanksgiving?" },
        { prompt: "How's the semester going?" }, { prompt: "Did you watch the game last night?" }, { prompt: "How long have you been on the team?" }, { prompt: "Where are you from originally?" }
      ] },
    useIt: "Answer, add one detail, then ask a question back." },

  { id: "C2", track: "conversation", title: "Follow-up questions",
    idea: [
      "A Harvard study across three experiments found that people who ask more questions, and especially follow-up questions, are liked more. In speed dating, people who asked more follow-ups got more second dates.",
      "A follow-up builds on what they just said: “Oh, Savannah? What took you there?” A new-topic question (“So, do you like sports?”) doesn't count. It shows you weren't listening.",
      "The same study found people underestimate how much this helps. You don't need to be interesting. Be interested."
    ],
    source: "Huang, Yeomans, Brooks, Minson and Gino (2017), Journal of Personality and Social Psychology 113(3).",
    evidence: "Strong: three studies of live conversations, plus speed-dating data.",
    examples: ["They: “I just got back from Denver.” You: “Oh nice, was it for work or fun?”", "They: “I'm training for a half marathon.” You: “How far are you running now?”", "They: “We adopted a dog.” You: “What kind? How's the first week going?”"],
    drill: { engine: "say", mode: "followup", needQuestion: true, pass: 6, intro: "Hear what they say, then ask a follow-up that uses something from their line. It has to be a question and reuse one of their words.",
      items: [
        { prompt: "I just got back from a week in Portugal." }, { prompt: "My sister's getting married next month." }, { prompt: "I'm thinking about switching teams." },
        { prompt: "We finally closed that deal last night." }, { prompt: "I started taking pottery classes." }, { prompt: "My flight got canceled twice this week." },
        { prompt: "I've been reading a lot about private credit lately." }, { prompt: "We're moving to Brooklyn in the spring." }
      ] },
    useIt: "Ask at least two follow-up questions that build on what they just said." },

  { id: "C3", track: "conversation", title: "Catch the free information",
    idea: [
      "People drop extra details all the time: “Good, just tired. We drove back from my cousin's wedding in Savannah.” That line has three hooks: tired, a cousin's wedding, Savannah. Any of them can start a real conversation.",
      "Pick the hook that seems to matter most to them, usually the one with emotion or the most specific detail, and ask about it.",
      "This is the listening half of follow-up questions. Researchers measured the same thing as responsiveness: showing you heard and understood."
    ],
    source: "Huang et al. (2017): responsiveness drives the effect of follow-up questions.",
    evidence: "Strong for the underlying mechanism; picking the best hook is a practitioner skill.",
    examples: ["They: “Good, a little sore. First rugby game in ten years.” You: “Rugby! What got you back into it?”"],
    drill: { engine: "choose", pass: 5, intro: "Pick the best hook to follow up on, then say your follow-up out loud.",
      items: [
        { line: "Good, just tired. We drove back from my cousin's wedding in Savannah.", options: ["“Why are you tired?”", "“Oh, how was the wedding? Is Savannah as pretty as people say?”", "“I've never been to a wedding.”", "“Cool.”"], a: 1, why: "The wedding and Savannah carry the most feeling and detail." },
        { line: "Not bad. I'm a little distracted, my daughter has her first recital tonight.", options: ["“What are you distracted by?”", "“Oh, that's exciting! What does she play?”", "“Recitals are long.”", "“How's work?”"], a: 1, why: "The recital is clearly what's on their mind." },
        { line: "It was fine. Spent most of Saturday fixing a leak, then finally got to watch the Bucs.", options: ["“What kind of leak?”", "“Ha, rough start. Did the Bucs at least make it worth it?”", "“I don't watch football.”", "“Saturday is my favorite day.”"], a: 1, why: "Acknowledge the annoyance, then go to the fun part." },
        { line: "Busy. I'm covering for two people while we hire, and I'm studying for the CFA.", options: ["“Why are you hiring?”", "“That's a lot at once. Which level are you studying for?”", "“The CFA is hard.”", "“Busy is good.”"], a: 1, why: "Sympathy plus a specific question about their goal." },
        { line: "Great, actually. I just got back from my first marathon, so I'm walking funny.", options: ["“Why are you walking funny?”", "“Your first marathon? Congrats! How did it go?”", "“I could never run that far.”", "“Marathons are bad for your knees.”"], a: 1, why: "The milestone is the hook." },
        { line: "Pretty quiet. We're house hunting, so every weekend is open houses now.", options: ["“Houses are expensive.”", "“Oh exciting. What area are you looking in?”", "“I rent.”", "“Quiet is nice.”"], a: 1, why: "A big life step; ask about the specifics." }
      ] },
    useIt: "Pick up a detail the other person offers and ask about it." },

  { id: "C4", track: "conversation", title: "Listener sounds",
    idea: [
      "In English conversation, the listener isn't silent. Short reactions like “Oh nice,” “No way,” “Wait, really?” and “That's rough” show you're following and keep the speaker going. Linguists call these backchannels.",
      "Silence while someone tells a story can feel cold to an American speaker, even if you're listening closely.",
      "Match the reaction to the emotion: good news, surprise, bad news, or something funny."
    ],
    source: "Conversation-analysis research on backchannels and turn-taking.",
    evidence: "Well documented that listeners use them and that they shape how conversations go; specific phrases vary by culture.",
    examples: ["“No way. Seriously?”", "“Oh, that's rough. I'm sorry.”", "“Ha, that's amazing.”", "“Mm-hm, makes sense.”", "“Wait, really? What happened?”"],
    drill: { engine: "choose", pass: 5, intro: "Pick the reaction that fits, then say it with the right tone.",
      items: [
        { line: "I got the offer! They called me this morning.", options: ["“Okay.”", "“No way, congrats! That's huge.”", "“What's the salary?”", "“I'm sorry.”"], a: 1, why: "Big good news gets big energy." },
        { line: "My laptop died right before the presentation.", options: ["“Ha, nice.”", "“Oh no, that's rough. What did you do?”", "“You should back up your files.”", "“Cool.”"], a: 1, why: "Sympathy first, then a question. Skip the lecture." },
        { line: "And then the CEO walked in while I was eating his lunch by mistake.", options: ["“That's bad.”", "“Wait, really? What did he say?”", "“You should label your food.”", "“Okay.”"], a: 1, why: "Funny story: show surprise and ask for the ending." },
        { line: "We're thinking of moving the team offsite to Thursday.", options: ["“No way!”", "“Mm-hm, makes sense.”", "“That's rough.”", "“Ha, amazing.”"], a: 1, why: "Neutral information gets a neutral acknowledgment." },
        { line: "My dad's in the hospital, so I've been back and forth.", options: ["“Oh no.” only", "“I'm really sorry. How's he doing?”", "“Hospitals are expensive.”", "“Wait, really?”"], a: 1, why: "Care and an open question, without prying." },
        { line: "I finally ran a mile under seven minutes.", options: ["“That's slow.”", "“Oh nice, that's a big milestone!”", "“Why?”", "“Mm-hm.”"], a: 1, why: "A personal win deserves real enthusiasm." }
      ] },
    useIt: "React while they talk: “Oh nice,” “No way,” “That's rough.”" },

  { id: "C5", track: "conversation", title: "20-second stories",
    idea: [
      "Interesting people tell short stories, not long ones. In small talk, the sweet spot is about 20 seconds: one setup line, one surprising detail, one line about how it ended or how you felt.",
      "First tell the story with no limit, then cut it to 20 seconds. The second version is the one you'll actually use, and it's almost always better.",
      "Collect a few: your hometown, why you picked your field, a travel moment, something that went wrong. Once they're ready, you're never stuck for something to say."
    ],
    source: "Built on the 4/3/2 idea (Nation 1989): repeat with less time to sharpen it.",
    evidence: "The time-pressure repetition is research-backed; the 20-second target is practitioner advice.",
    examples: ["“My first week in Tampa, I didn't know about afternoon storms. I walked to class in sneakers and showed up completely soaked. Now I check the radar like a local.”"],
    drill: { engine: "talk", rounds: [60, 20], story: true, pass: 1, intro: "Tell the story freely in up to 60 seconds, then again in 20. The goal is a tight second round.",
      prompts: [
        { text: "Tell a story about your first week somewhere new." }, { text: "Tell a story about a time something went wrong and turned out fine." }, { text: "Tell the story of why you chose your field." },
        { text: "Tell a funny travel story." }, { text: "Tell a story about a meal you'll never forget." }, { text: "Tell a story about a lesson you learned the hard way." }
      ] },
    useIt: "Share one short story of about 20 seconds when it fits." },

  { id: "C6", track: "conversation", title: "Changing topics and leaving well",
    idea: [
      "Two moves make small talk feel easy: moving to a new topic without a jolt, and leaving without awkwardness.",
      "To change topics, connect it to something they said: “Speaking of travel, are you going anywhere for the holidays?” To bring up business: “By the way, while I have you, I wanted to ask about...”",
      "To leave, signal, reference, open the door: “I'll let you get back to it. Good luck with the move, and let me know how the house hunt goes.”"
    ],
    source: "Builds on the ladder's bridging and exit skills.",
    evidence: "Practitioner technique.",
    examples: ["“Speaking of New York, have you been to the new food hall?”", "“By the way, while I have you, could I ask about the model review?”", "“I'll let you go. Great catching up, and good luck Thursday!”"],
    drill: { engine: "choose", pass: 5, intro: "Pick the smoothest line, then say it out loud.",
      items: [
        { line: "You need to bring up a work question after chatting about their trip.", options: ["“Anyway. The deck.”", "“Sounds like an amazing trip. By the way, while I have you, could I ask about the deck?”", "“Can we talk about work now?”", "Just leave."], a: 1, why: "Acknowledge, then bridge with “by the way, while I have you.”" },
        { line: "You want to end a chat at a networking event.", options: ["Walk away mid-sentence.", "“It was great meeting you. I'm going to grab a drink, but let's connect on LinkedIn.”", "“I'm bored.”", "“Okay, bye.”"], a: 1, why: "Signal, reason, open door." },
        { line: "The topic died after a long silence about the weather.", options: ["Keep talking about the weather.", "“Speaking of the rain, any plans for the weekend if it clears up?”", "Check your phone.", "“So...”"], a: 1, why: "Connect the old topic to a new one." },
        { line: "Your manager is clearly busy, but stopped to chat.", options: ["Keep the conversation going.", "“I'll let you get back to it. Good luck with the client call!”", "“You look busy.”", "Stop talking."], a: 1, why: "Respect their time and reference what they're doing." },
        { line: "You want to move from small talk to asking for career advice on a coffee chat.", options: ["“So, can you refer me?”", "“That's a great story. It actually connects to something I wanted to ask about your path into credit.”", "“Okay, my questions.”", "Read your question list."], a: 1, why: "Use what they said as the bridge." },
        { line: "A colleague keeps talking and you need to get to a meeting.", options: ["Interrupt with “I have to go.”", "“Sorry to cut you off, I have a meeting in two minutes. Want to finish this at lunch?”", "Look at your watch repeatedly.", "Walk away."], a: 1, why: "Apologize, give the reason, offer a follow-up." }
      ] },
    useIt: "Change topics by connecting to something they said, and close the chat warmly." }
];
