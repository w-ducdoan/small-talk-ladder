import { MORE_TOPICS, MORE_CARDS } from "./know-cold-more.js";
// Static curriculum: skills, partner levels, topics and the Know Cold library.
export const SKILLS = {
  follow_up: { label: "Follow-up questions", short: "Follow-ups", desc: "Ask a second and third question that builds on what they just said, instead of jumping to a new topic." },
  turn_back: { label: "Turning it back", short: "Turn-back", desc: "Share a little about yourself, then hand the conversation back to them." },
  thread:    { label: "Keeping a thread alive", short: "Threading", desc: "Add a detail, an opinion or a short story so the topic does not die after one answer." },
  bridge:    { label: "Bridging to business", short: "Bridging", desc: "Move from small talk to the real reason for the conversation without a jolt." },
  exit:      { label: "Graceful exits", short: "Exits", desc: "Wrap up warmly, reference something they said, and leave a door open." },
  natural:   { label: "Natural phrasing", short: "Phrasing", desc: "Use idioms, contractions and word order a native speaker would, not a translation." }
};
export const LEVELS = [
  { n: 1, name: "Friendly", behavior: "Warm and easy. Carries half the conversation, asks the learner questions back, speaks clearly, explains any reference they make, no slang." },
  { n: 2, name: "Neutral", behavior: "Polite and pleasant, answers fully but rarely asks anything back, so the learner has to drive. Mild everyday idioms." },
  { n: 3, name: "Busy senior", behavior: "A senior person short on time. One-sentence answers, slightly distracted, warms up only when the learner says something specific or interesting, and starts wrapping up if the conversation stalls." },
  { n: 4, name: "Native speed", behavior: "Fast, casual American speech: slang, sarcasm, contractions, sports and pop-culture references with no explanation, light inside jokes. Expects the learner to keep up." },
  { n: 5, name: "Curveballs", behavior: "Everything in native speed, plus: sometimes interrupts, changes topic abruptly, leaves a silence (says 'Yeah.' and waits), asks the learner to explain something they mentioned, teases lightly." },
  { n: 6, name: "High stakes", behavior: "A real-stakes setting with two or three people (for example a managing director and a VP at a client dinner). Mixes every earlier behavior, the others talk among themselves, and the learner has to break in, hold the room and steer." }
];
export const DEPTH = {
  1: "Awareness: know what it is and ask a sensible question.",
  2: "Opinion: hold a light opinion and trade takes.",
  3: "Insider: follow the insider thread (fantasy leagues, handicaps, rivalries, local lore)."
};
export const SETTINGS = {
  one_on_one: { label: "One-on-one", desc: "Just the learner and one other person." },
  group:      { label: "Small group", desc: "Three people talking; the learner must get a word in and include others." },
  event:      { label: "Networking event", desc: "A standing reception; the learner joins a conversation already under way and must leave it gracefully." }
};
export const KIND = {
  normal:      { label: "Ladder rep", desc: "A normal rep at the learner's current level for the target skill." },
  stretch:     { label: "Stretch round", desc: "A stretch round one level above the learner's current level, to test readiness. Make it genuinely harder." },
  maintenance: { label: "Maintenance", desc: "A maintenance rep on a skill outside this week's focus, so it does not fade." },
  override:    { label: "Your pick", desc: "The learner chose this level themselves for an upcoming real event." },
  drill:       { label: "Topic drill", desc: "The learner picked this topic from the Know Cold library to practice." }
};
// months: when the topic is in season; [] = always
export const TOPICS = {
  nfl:              { label: "NFL", months: [9, 10, 11, 12, 1, 2] },
  college_football: { label: "College football", months: [8, 9, 10, 11, 12, 1] },
  fantasy_football: { label: "Fantasy football", months: [9, 10, 11, 12] },
  nba:              { label: "NBA", months: [10, 11, 12, 1, 2, 3, 4, 5, 6] },
  march_madness:    { label: "March Madness", months: [3, 4] },
  mlb:              { label: "Baseball", months: [3, 4, 5, 6, 7, 8, 9, 10] },
  golf:             { label: "Golf", months: [3, 4, 5, 6, 7, 8, 9] },
  tennis:           { label: "Tennis", months: [] },
  soccer:           { label: "Soccer", months: [] },
  thanksgiving:     { label: "Thanksgiving", months: [11] },
  holidays:         { label: "Holiday season", months: [12, 1] },
  summer_holidays:  { label: "Summer holidays", months: [5, 6, 7, 8, 9] },
  weekend_plans:    { label: "Weekend plans", months: [] },
  food:             { label: "Food and restaurants", months: [] },
  travel:           { label: "Travel", months: [] },
  nyc_life:         { label: "Living in New York", months: [] },
  tv_streaming:     { label: "TV and streaming", months: [] },
  florida_life:     { label: "Florida life and weather", months: [] },
  tech_ai:          { label: "Tech and AI news", months: [] },
  fitness:          { label: "Fitness", months: [] },
  markets_work:     { label: "Markets and work", months: [] },
  hometown:         { label: "Where you're from", months: [] },
  ...MORE_TOPICS
};

// The Know Cold library. Evergreen on purpose: no scores, standings or news that go stale.
export const KNOW_COLD = [
  { key: "weekend", topic: "weekend_plans", title: "The weekend question",
    when: "Every Monday and Friday, every elevator, every call that starts a minute early.",
    essentials: [
      "“How was your weekend?” is a ritual, not a survey. The expected answer is one specific detail, then the question back.",
      "“Good, you?” ends the conversation. “Good, I finally tried that ramen place on Fowler. How about you, anything fun?” keeps it going.",
      "Friday version: “Any plans for the weekend?” A low-key answer is fine: “Keeping it quiet, probably a long run and catching up on sleep.”",
      "If they did something big (a wedding, a trip, a kid's tournament), that is your follow-up for the next two minutes.",
      "Remember it. Asking “How was the wedding?” next week is the strongest small-talk move there is."
    ],
    ask: ["Anything fun?", "How was it? Was it as good as you hoped?", "Do you do that every year?"],
    bridge: "Nothing to report? Say so lightly and ask back: “Honestly a quiet one. How about you?”",
    avoid: ["One-word answers", "Turning it into a full itinerary"] },

  { key: "nfl", topic: "nfl", title: "NFL basics",
    when: "September through early February, especially Monday mornings.",
    essentials: [
      "32 teams, a 17-game regular season from September to early January, then playoffs. The Super Bowl is the first or second Sunday in February.",
      "Games are mostly Sunday afternoons, plus Sunday Night, Monday Night and Thursday Night Football. “Did you catch the game?” usually means the local team's Sunday game.",
      "Tampa has the Buccaneers (“the Bucs”), winners of two Super Bowls, the second with Tom Brady. New York has the Giants and Jets, who both play in New Jersey.",
      "Super Bowl Sunday is a social event as much as a game: parties, the halftime show, the commercials. Plenty of people watch for those alone.",
      "Fans are loyal to a home team for life, often wherever they grew up, so “Who's your team?” is a question about their roots."
    ],
    ask: ["Who's your team?", "Did you grow up a fan, or did you pick them up later?", "Are you going to any games this year?"],
    bridge: "If you don't follow it: “I'm still learning football, so I'm a Bucs fan by default. Who do you root for?” Honest beats faking it.",
    avoid: ["Pretending to know a player or a score", "Saying American football is boring"] },

  { key: "college_football", topic: "college_football", title: "College football and alma maters",
    when: "Fall Saturdays, and any time someone mentions where they went to school.",
    essentials: [
      "College football is played on Saturdays, and in the South it can be bigger than the NFL. Tailgating (parking-lot cookouts before the game) is part of it.",
      "Conferences group the schools. The SEC (Alabama, Georgia, Florida, LSU and others) is the most famous for football.",
      "Rivalry games matter more than records: Florida vs. Georgia, Ohio State vs. Michigan, Alabama vs. Auburn (“the Iron Bowl”).",
      "The season ends with bowl games and the College Football Playoff in December and January.",
      "“Where did you go to school?” is common in finance. People stay attached to their school's team for decades, so it's an easy opening."
    ],
    ask: ["Where'd you go to school?", "Do you still go back for games?", "What's the big rivalry there?"],
    bridge: "Your own school counts: “I'm at [your school], so I'm still learning what it's like to root for them.”",
    avoid: ["Insulting someone's school, even as a joke, until you know them well"] },

  { key: "golf", topic: "golf", title: "Golf",
    when: "Spring and summer, client outings, and anyone senior in finance.",
    essentials: [
      "The four men's majors: the Masters (early April at Augusta National in Georgia), the PGA Championship (May), the U.S. Open (June) and the Open Championship in the UK (July).",
      "The Masters is the cultural one: the green jacket, the azaleas, people taking a long lunch to watch Sunday afternoon.",
      "A round is 18 holes and takes four to five hours. “Playing 18” or “getting a round in” is the phrase. Nine holes is the short version.",
      "A handicap is a player's skill rating, and lower is better. “What's your handicap?” is a friendly question between golfers, not a test.",
      "Golf outings and member-guest events are real networking in finance. Being a beginner is fine; people like teaching it."
    ],
    ask: ["Where do you usually play?", "How long have you been playing?", "Do you get out much during the season?"],
    bridge: "If you don't play: “I've only been to a driving range, but I keep meaning to learn properly. Is it as addictive as people say?”",
    avoid: ["Claiming you play when you don't; it comes up fast when someone invites you"] },

  { key: "baseball", topic: "mlb", title: "Baseball",
    when: "Spring through October, and every summer in New York.",
    essentials: [
      "A 162-game season from late March or April to late September, then playoffs and the World Series in October.",
      "Spring training happens in Florida and Arizona in February and March. Florida's is called the Grapefruit League.",
      "New York has the Yankees (the Bronx) and the Mets (Queens), and people pick a side. Tampa Bay has the Rays.",
      "Going to a game is about the experience as much as the score: hot dogs, a long summer evening, a company outing.",
      "Phrases that come from baseball: “ballpark figure,” “out of left field,” “step up to the plate,” “covering your bases.”"
    ],
    ask: ["Yankees or Mets?", "Have you been to a game this year?", "Did you play growing up?"],
    bridge: "“I've never been to a game. Which stadium should I go to first?” People love answering this.",
    avoid: ["Asking a Yankees fan if they like the Red Sox"] },

  { key: "basketball", topic: "nba", title: "NBA and March Madness",
    when: "NBA from October to June; March Madness for three weeks in March and April.",
    essentials: [
      "NBA: 30 teams, an 82-game season from October to April, playoffs into June. New York has the Knicks (Madison Square Garden) and the Brooklyn Nets.",
      "March Madness is the college basketball tournament: 68 teams, single elimination. The last four teams are the Final Four.",
      "Offices run bracket pools, where everyone predicts every game. Busted brackets and upsets are the small talk.",
      "“Cinderella” means an unexpected underdog that keeps winning.",
      "You can join a bracket pool knowing nothing. Picking by mascot or colors is a classic and gets a laugh."
    ],
    ask: ["Are you doing a bracket this year?", "How's your bracket holding up?", "Are you a Knicks fan?"],
    bridge: "“I filled out my first bracket. It's already ruined. How's yours?”",
    avoid: ["Overthinking it; most people's brackets are terrible too"] },

  { key: "thanksgiving", topic: "thanksgiving", title: "Thanksgiving",
    when: "All of November, and the week after.",
    essentials: [
      "The fourth Thursday of November. Most offices close Thursday and Friday, so it's a four-day weekend.",
      "It's about family and food: turkey, stuffing, mashed potatoes, cranberry sauce, pumpkin pie. Every family has its own traditions.",
      "Football is part of the day: NFL games run all afternoon on Thanksgiving.",
      "“Friendsgiving” is a Thanksgiving dinner with friends instead of family, common for people who can't travel home.",
      "The Wednesday before is one of the busiest travel days of the year. Black Friday, the day after, is the big shopping day."
    ],
    ask: ["Are you heading home for Thanksgiving?", "Do you host or travel?", "What's the one dish your family can't skip?"],
    bridge: "Being an international student is a great story here: “My first Thanksgiving was at a friend's place. What's yours usually like?”",
    avoid: ["Assuming everyone goes home; ask instead"] },

  { key: "holidays", topic: "holidays", title: "December holidays and New Year",
    when: "Mid-November through early January.",
    essentials: [
      "At work, “Happy holidays” is the safe, inclusive greeting. People celebrate Christmas, Hanukkah, or nothing in particular.",
      "Office holiday parties are in December. Go, stay a reasonable time, and keep drinks light.",
      "“Are you doing anything for the break?” or “Any plans for the holidays?” is the standard question.",
      "New Year's resolutions come up in January. “Did you make any resolutions?” is easy small talk.",
      "Many people take the week between Christmas and New Year's off, and things are quiet in the office."
    ],
    ask: ["Any plans for the holidays?", "Are you traveling or staying local?", "Did you make any resolutions?"],
    bridge: "Share your own tradition: “Back home the big holiday is [yours], so December is pretty relaxed for me.”",
    avoid: ["Asking what someone got as a gift at work", "Assuming someone's religion"] },

  { key: "summer", topic: "summer_holidays", title: "Summer in America",
    when: "Late May to early September.",
    essentials: [
      "Memorial Day (the last Monday of May) is the unofficial start of summer. Labor Day (the first Monday of September) is the unofficial end.",
      "The Fourth of July (Independence Day) means fireworks, cookouts and barbecues.",
      "New Yorkers leave the city on summer weekends: the Hamptons, the Jersey Shore, upstate, Cape Cod. “Are you getting out of the city this weekend?”",
      "Some firms do “summer Fridays” (leaving early on Fridays). Don't assume yours does.",
      "Interns get asked where they're living and what they've explored. Have one favorite spot ready."
    ],
    ask: ["Are you getting out of the city at all this summer?", "Any good July Fourth plans?", "Where do you usually go in the summer?"],
    bridge: "“This is my first summer in New York. What's the one thing I can't miss?”",
    avoid: ["Complaining about the heat for more than one line"] },

  { key: "nyc", topic: "nyc_life", title: "Living in New York",
    when: "Any internship or job in the city, and every new face you meet there.",
    essentials: [
      "“Where are you living?” means which neighborhood: the Upper East or West Side, Midtown, the West or East Village, the Financial District, Brooklyn (Williamsburg, Park Slope), Hoboken or Jersey City across the river.",
      "The commute is universal small talk: which subway line, how long it takes, the delays.",
      "Everyone has a favorite pizza slice, bagel spot and coffee place, and strong opinions about them.",
      "Rent and apartment hunting are relatable complaints. Exact numbers are usually left out.",
      "People respect it when you've explored: a museum, Central Park, a neighborhood outside Manhattan."
    ],
    ask: ["Where are you living?", "How's the commute?", "What's your go-to spot around there?"],
    bridge: "“I'm still figuring out the subway. Any neighborhood I should spend a Saturday in?”",
    avoid: ["Saying Times Square is your favorite place"] },

  { key: "food", topic: "food", title: "Food, coffee and restaurants",
    when: "Lunch, team dinners, client dinners, and any slow moment.",
    essentials: [
      "Restaurant recommendations are the easiest trade there is. Have two of your own ready in every city you spend time in.",
      "Client dinners in finance are often at steakhouses. Follow the host's lead on ordering and drinks.",
      "Coffee orders are personal. “What's your order?” is a fun question with a quick answer.",
      "Brunch is a weekend institution, especially in New York.",
      "Your own food background is a strength. People love a recommendation for an authentic place from someone who knows the cuisine."
    ],
    ask: ["Any good spots around here?", "What's your go-to lunch place?", "Have you tried anywhere new lately?"],
    bridge: "If people ask about the food you grew up with, offer it: “If you ever want real [cuisine] food, I know exactly where to go.” That kind of offer turns into plans.",
    avoid: ["Criticizing someone's restaurant pick"] },

  { key: "tv", topic: "tv_streaming", title: "TV, streaming and pop culture",
    when: "Monday mornings, lunch, and dinners where work talk runs out.",
    essentials: [
      "“Are you watching anything good?” is a safe opener with everyone.",
      "Finance people often talk about shows set in their world, like Industry and Succession (HBO) or Billions.",
      "Ask before discussing a plot. “No spoilers, I'm only on season two” is a normal thing to say.",
      "You don't need to watch everything. Asking for a recommendation works just as well.",
      "Big live events (the Super Bowl, the Oscars, a big finale) get talked about the next morning."
    ],
    ask: ["Are you watching anything good?", "Is it worth starting?", "What else do you like that's similar?"],
    bridge: "“I just finished Industry. Is that what working in finance is actually like?” Guaranteed conversation.",
    avoid: ["Spoilers", "Looking down on someone's guilty-pleasure show"] },

  { key: "fitness", topic: "fitness", title: "Fitness and sports you play",
    when: "Mornings, Mondays, and with people who mention a race or a class.",
    essentials: [
      "Running is big. The New York City Marathon is the first Sunday of November, and “Are you training for anything?” is a normal question.",
      "Gym and class culture: Equinox, SoulCycle, Barry's, CrossFit, Peloton at home. People like talking about their routine.",
      "Pickleball has exploded with every age group, including senior people at work.",
      "Tennis and pickleball invitations are common ways to get to know colleagues outside the office.",
      "Sports you play yourself are better small talk than sports you watch: you have real stories."
    ],
    ask: ["Are you training for anything?", "Where do you work out?", "Do you play anything?"],
    bridge: "Lead with your own sport: “I play [your sport] pretty seriously. It's more intense than people expect.”",
    avoid: ["Commenting on anyone's body or diet"] },

  { key: "travel", topic: "travel", title: "Travel and where you're from",
    when: "First meetings, before and after holidays, and any time someone says “Where are you from?”",
    essentials: [
      "“Where are you from?” can mean hometown or where you grew up. Answer with a story hook, not just a place name.",
      "Asking about someone's hometown is safe and personal: what it's like, whether they go back, what to eat there.",
      "Travel stories work best short: one place, one detail, one question back.",
      "Upcoming trips are an easy follow-up later: “How was Portugal?”",
      "Having lived in two countries is interesting to most people. Don't undersell it."
    ],
    ask: ["Where's home for you?", "Do you get back there much?", "Any trips coming up?"],
    bridge: "Give the place plus one hook: “I grew up in [hometown], so [one detail]. Where's home for you?”",
    avoid: ["Ranking countries", "Asking someone where they're “really” from"] },

  { key: "markets", topic: "markets_work", title: "Markets and work small talk",
    when: "Anywhere in finance: elevators, coffee chats, the first minutes of a call.",
    essentials: [
      "“What's keeping you busy?” and “How's the deal flow?” are standard openers between finance people.",
      "Big macro events come up: Fed meetings, jobs reports, earnings season. Having a light, neutral take is enough.",
      "Busy season, closing a deal and late nights are shared experiences. Some sympathy is the right response.",
      "Talk about the market, never about confidential deals. “I can't say much, but it's been busy” is a perfectly good answer.",
      "Asking how someone got into their role always works and leads naturally into career advice."
    ],
    ask: ["What's keeping you busy these days?", "How did you end up in your group?", "What's the market feeling like on your side?"],
    bridge: "This is the natural bridge from small talk to business: “Speaking of busy, I'd love to hear how your team's year has been.”",
    avoid: ["Sharing deal names or numbers", "Strong political takes on the economy"] },

  { key: "florida", topic: "florida_life", title: "Tampa and Florida life",
    when: "Anyone visiting Tampa, alumni events, and calls with people who ask about Florida.",
    essentials: [
      "Hurricane season runs June 1 to November 30. “Did the storm affect you?” is a caring question after one hits.",
      "The heat and humidity are constant small talk, as is the afternoon summer rain.",
      "Gasparilla, Tampa's pirate-themed festival with a big parade, is every January.",
      "Tampa sports: the Bucs (football) and the Lightning (hockey, three Stanley Cups). Hockey is big here, which surprises people.",
      "Snowbirds are northerners who spend the winter in Florida. The beaches (Clearwater, St. Pete) are the default recommendation."
    ],
    ask: ["Have you spent much time in Florida?", "Which beach do you go to?", "Do you get down here in the winter?"],
    bridge: "“If you're ever in Tampa, I'll tell you where to eat. The Cuban sandwiches in Ybor City are the real thing.”",
    avoid: ["Florida-man jokes with people who live there"] },

  { key: "steer_clear", topic: null, title: "What to steer clear of",
    when: "Always, especially with people you've just met.",
    essentials: [
      "Politics and religion: if someone brings them up, a neutral “It's a lot right now” and a topic change is fine.",
      "Salary, bonuses, rent amounts and anyone's net worth.",
      "Health, weight, age, pregnancy and relationship status, unless they bring it up first.",
      "Gossip about colleagues, even when others start it.",
      "Complaining about your current or past employer."
    ],
    ask: ["Changing the subject: “Anyway, how's your week been?”", "“Totally fair. Hey, did you end up trying that place?”"],
    bridge: "A smooth exit from a bad topic is a skill in itself. Acknowledge briefly, then pivot to something they mentioned earlier.",
    avoid: ["Arguing, even when you're right"] }
];
KNOW_COLD.push(...MORE_CARDS);
