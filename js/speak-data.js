// Speak tab content: frameworks, levels, topics, curveballs and warm-ups. All free, no API calls.

// split = share of the speaking time each step should take, used for the live cue timeline.
export const FRAMEWORKS = {
  prep: { name: "PREP", use: "Giving an opinion",
    steps: [["Point", "Your position in one sentence."], ["Reason", "Why you believe it."], ["Example", "One specific fact, number or story that proves the reason."], ["Point again", "Restate the position, sharper than the first time."]],
    split: [0.15, 0.25, 0.45, 0.15],
    sample: "Point: Remote work should be the default for focused work. Reason: deep work needs long stretches without interruption. Example: on my remote days I finish models in half the time. Point: so let people stay home for focus days, and come in for collaboration." },
  pyramid: { name: "Answer first (the Pyramid)", use: "Recommendations and updates",
    steps: [["Answer", "Lead with the recommendation or conclusion."], ["Support 1", "The strongest reason."], ["Support 2", "The second reason."], ["Support 3", "The third reason, or the main risk and how to handle it."], ["So", "What should happen next."]],
    split: [0.15, 0.22, 0.22, 0.22, 0.19],
    sample: "Answer: we should launch in Texas first. Support: lowest cost to serve, fastest-growing customer base, and no strong local competitor. So: let's run a 90-day pilot in Dallas." },
  wsn: { name: "What, So what, Now what", use: "Explaining something you researched",
    steps: [["What", "What it is, in plain words."], ["So what", "Why it matters, and to whom."], ["Now what", "What happens next, or what the listener should do."]],
    split: [0.35, 0.4, 0.25],
    sample: "What: the Fed sets short-term interest rates. So what: those rates move mortgage costs, business borrowing and stock prices. Now what: watch the next meeting, because a cut would make borrowing cheaper for everyone." },
  star: { name: "STAR", use: "Telling a story (“Tell me about a time...”)",
    steps: [["Situation", "Where and when, in one or two sentences."], ["Task", "What you had to do, and why it was hard."], ["Action", "What you did. Say “I,” not “we.”"], ["Result", "What happened, with a number if you have one, and what you learned."]],
    split: [0.15, 0.15, 0.45, 0.25],
    sample: "Situation: two days before a client deadline, our model broke. Task: I had to rebuild the debt schedule. Action: I traced the error, rebuilt it and had a teammate check it. Result: we delivered on time, and I now build checks into every model." },
  ppf: { name: "Past, Present, Future", use: "Trends and big-picture topics",
    steps: [["Past", "How it used to be."], ["Present", "Where it is now, and what changed."], ["Future", "Where it's going, and what you'd watch."]],
    split: [0.3, 0.35, 0.35],
    sample: "Past: banks did most corporate lending. Present: private credit funds now compete for many of those loans. Future: expect more partnerships between banks and funds, and watch default rates." },
  thesis: { name: "Investment thesis", use: "Pitching a company or idea",
    steps: [["Thesis", "The call in one sentence: what and why."], ["Driver 1", "The first reason it works."], ["Driver 2", "The second reason."], ["Risks", "What could go wrong, and why you're still comfortable."], ["Why now", "The catalyst, or why the price or timing is right."]],
    split: [0.15, 0.22, 0.22, 0.21, 0.2],
    sample: "Thesis: Costco is a long-term compounder. Drivers: membership fees are recurring profit, and renewal rates are very high. Risk: the valuation is rich. Why now: new warehouse openings keep growth steady." },
  three21: { name: "3-2-1 (Vinh Giang)", use: "Speaking on the spot with no prep",
    steps: [["One thing", "One main point. Take the first one that comes to mind."], ["Two types", "Split the topic into two kinds or two ways."], ["Three steps", "Three actions, in order."]],
    split: [0.3, 0.3, 0.4],
    sample: "One thing: travel is amazing because you can go anywhere. Two types: regional trips or international flights. Three steps: plan it, book it, go." }
};
export const TYPE_FRAMEWORK = { opinion: "prep", recommendation: "pyramid", explainer: "wsn", story: "star", trend: "ppf", pitch: "thesis", impromptu: "three21" };
export const TYPE_LABEL = { opinion: "Opinion", recommendation: "Recommendation", explainer: "Explainer", story: "Story", trend: "Trend", pitch: "Pitch", impromptu: "Impromptu" };

// prep in seconds; target and max speaking time in seconds.
export const SPEAK_LEVELS = [
  { n: 1, name: "Warm start", prep: 900, target: 60, max: 150, types: ["opinion"], hard: 1, showFramework: true, curveball: false },
  { n: 2, name: "Steady", prep: 900, target: 90, max: 180, types: ["opinion", "explainer", "story"], hard: 1, showFramework: true, curveball: false },
  { n: 3, name: "Mixed formats", prep: 600, target: 120, max: 180, types: ["opinion", "recommendation", "explainer", "story", "trend", "pitch"], hard: 2, showFramework: true, curveball: false },
  { n: 4, name: "Less prep", prep: 300, target: 120, max: 180, types: ["opinion", "recommendation", "explainer", "story", "trend", "pitch"], hard: 2, showFramework: true, curveball: true },
  { n: 5, name: "Your call", prep: 120, target: 120, max: 180, types: ["opinion", "recommendation", "explainer", "trend", "pitch", "impromptu"], hard: 3, showFramework: false, curveball: true },
  { n: 6, name: "On the spot", prep: 10, target: 120, max: 180, types: ["impromptu", "opinion", "recommendation", "trend"], hard: 3, showFramework: false, curveball: true }
];
export const SPEAK_SKILLS = {
  point: "Clear point",
  support: "Reasons and evidence",
  close: "Strong close",
  structure: "Structure",
  delivery: "Delivery"
};

// d = difficulty 1 (familiar) to 3 (abstract or unfamiliar).
export const SPEAK_TOPICS = [
  // Opinion
  ["Is remote work better than working in an office?", "opinion", 1], ["Should college be free?", "opinion", 1], ["Is social media good for society?", "opinion", 1],
  ["Should everyone learn to code?", "opinion", 1], ["Is it better to rent or to buy a home?", "opinion", 1], ["Should tipping be replaced with higher wages?", "opinion", 1],
  ["Is a four-day work week a good idea?", "opinion", 1], ["Should phones be banned in classrooms?", "opinion", 1], ["Are internships worth it if they're unpaid?", "opinion", 1],
  ["Is it better to specialize or be a generalist early in your career?", "opinion", 2], ["Should companies require employees to return to the office?", "opinion", 2], ["Is a college degree still worth the cost?", "opinion", 2],
  ["Should investors care about ESG?", "opinion", 2], ["Is passive investing better than active investing?", "opinion", 2], ["Should the US move to a cashless society?", "opinion", 2],
  ["Is it better to work at a big firm or a startup first?", "opinion", 2], ["Should AI-generated work be allowed in school?", "opinion", 2], ["Is hustle culture good or bad?", "opinion", 1],
  ["Should cities ban cars from downtown areas?", "opinion", 2], ["Is it ethical to eat meat?", "opinion", 3], ["Does money buy happiness?", "opinion", 2],
  ["Should voting be mandatory?", "opinion", 3], ["Are standardized tests a fair way to measure students?", "opinion", 2], ["Is failure necessary for success?", "opinion", 2],
  ["Should billionaires exist?", "opinion", 3], ["Is it better to be liked or respected at work?", "opinion", 2], ["Should the retirement age be raised?", "opinion", 3],
  // Recommendation
  ["Your friend has $10,000 to invest. What should they do with it?", "recommendation", 1], ["How should a new grad spend their first year at work?", "recommendation", 1],
  ["Your university wants more students to graduate on time. What should it do?", "recommendation", 2], ["A coffee shop's sales are falling. What should the owner do?", "recommendation", 2],
  ["Should a company expand to Asia or Europe first?", "recommendation", 3], ["How should a student prepare for finance recruiting?", "recommendation", 1],
  ["A restaurant chain wants younger customers. What should it change?", "recommendation", 2], ["Your team keeps missing deadlines. What would you fix first?", "recommendation", 2],
  ["How should a small business use AI?", "recommendation", 2], ["Your city wants less traffic. What should it do?", "recommendation", 2],
  ["A gym is losing members. What should it do?", "recommendation", 2], ["How should someone start building an emergency fund?", "recommendation", 1],
  ["Should a family company sell to private equity?", "recommendation", 3], ["How should a bank attract younger customers?", "recommendation", 3],
  ["An airline keeps getting bad reviews. Where should it start?", "recommendation", 2], ["How should a new manager earn their team's trust?", "recommendation", 2],
  ["A sports team wants to sell more tickets. What should it do?", "recommendation", 2], ["How should a startup decide between growth and profit?", "recommendation", 3],
  ["What should a company do in its first week after a data breach?", "recommendation", 3], ["How should you prepare for a big presentation?", "recommendation", 1],
  // Explainer
  ["Explain how interest rates affect the economy.", "explainer", 2], ["Explain what inflation is to a 10-year-old.", "explainer", 1], ["Explain how a credit score works.", "explainer", 1],
  ["Explain what a private equity firm does.", "explainer", 2], ["Explain how a hurricane forms.", "explainer", 2], ["Explain how the stock market works.", "explainer", 1],
  ["Explain what a bond is and why people buy them.", "explainer", 2], ["Explain how electric cars work.", "explainer", 2], ["Explain what the Federal Reserve does.", "explainer", 2],
  ["Explain how vaccines work.", "explainer", 2], ["Explain what a recession is.", "explainer", 1], ["Explain how a mortgage works.", "explainer", 1],
  ["Explain what cloud computing is.", "explainer", 2], ["Explain how airlines price tickets.", "explainer", 3], ["Explain what a leveraged buyout is.", "explainer", 3],
  ["Explain how the Olympics choose a host city.", "explainer", 3], ["Explain why the housing market is so expensive.", "explainer", 2], ["Explain how a business makes money from a subscription.", "explainer", 1],
  ["Explain what a supply chain is.", "explainer", 2], ["Explain how tariffs affect prices.", "explainer", 2], ["Explain how a credit rating agency works.", "explainer", 3],
  ["Explain how compound interest works.", "explainer", 1], ["Explain what makes a city livable.", "explainer", 3], ["Explain how the electoral college works.", "explainer", 3],
  // Story
  ["Tell me about a time you failed and what you learned.", "story", 1], ["Tell me about a time you worked with someone difficult.", "story", 1], ["Tell me about the best decision you've made.", "story", 1],
  ["Tell me about a time you led a team.", "story", 1], ["Tell me about a time you changed someone's mind.", "story", 2], ["Tell me about a time you had to learn something fast.", "story", 1],
  ["Tell me about a time you made a mistake at work or school.", "story", 1], ["Tell me about a time you took a risk.", "story", 2], ["Tell me about a time you disagreed with a manager.", "story", 2],
  ["Tell me about a moment that changed your career plans.", "story", 2], ["Tell me about a time you handled pressure.", "story", 1], ["Tell me about a time you helped someone succeed.", "story", 2],
  ["Tell me about a time you adapted to a new culture.", "story", 1], ["Tell me about your proudest accomplishment.", "story", 1], ["Tell me about a time you received tough feedback.", "story", 2],
  // Trend
  ["How has AI changed the way people work?", "trend", 2], ["How has the way people shop changed?", "trend", 1], ["How has investing changed for regular people?", "trend", 2],
  ["How has the job market for graduates changed?", "trend", 2], ["How has travel changed over the last 20 years?", "trend", 1], ["How has banking changed?", "trend", 2],
  ["How has the music industry changed?", "trend", 2], ["How has dating changed?", "trend", 1], ["How has the way we watch TV changed?", "trend", 1],
  ["How have cars changed, and where are they going?", "trend", 2], ["How has private credit grown, and where is it going?", "trend", 3], ["How has news media changed?", "trend", 2],
  ["How has education changed with technology?", "trend", 2], ["How has fitness culture changed?", "trend", 1], ["How has the role of the office changed?", "trend", 2],
  ["Where is space travel going?", "trend", 3], ["How have sports changed with data and analytics?", "trend", 3], ["How has food delivery changed restaurants?", "trend", 2],
  // Pitch
  ["Pitch a company you admire as an investment.", "pitch", 2], ["Pitch a product you use every day as a business.", "pitch", 1], ["Pitch your hometown as a place to visit.", "pitch", 1],
  ["Pitch a stock you'd avoid, and why.", "pitch", 3], ["Pitch an idea for a new app.", "pitch", 2], ["Pitch yourself for your dream job.", "pitch", 1],
  ["Pitch a restaurant you love to an investor.", "pitch", 2], ["Pitch a sports team as a business.", "pitch", 3], ["Pitch a book everyone should read.", "pitch", 1],
  ["Pitch a city where a company should open its next office.", "pitch", 2], ["Pitch an industry you think will grow in the next ten years.", "pitch", 3], ["Pitch a change your school or company should make.", "pitch", 2],
  // Impromptu (one-word or tiny prompts, built for 3-2-1)
  ["Coffee", "impromptu", 1], ["Airports", "impromptu", 1], ["Mornings", "impromptu", 1], ["Rain", "impromptu", 1], ["Birthdays", "impromptu", 1], ["Mistakes", "impromptu", 2],
  ["Bridges", "impromptu", 2], ["Patience", "impromptu", 2], ["Maps", "impromptu", 2], ["Money", "impromptu", 1], ["Music", "impromptu", 1], ["Sleep", "impromptu", 1],
  ["Libraries", "impromptu", 2], ["Elevators", "impromptu", 2], ["Mirrors", "impromptu", 3], ["Keys", "impromptu", 3], ["Silence", "impromptu", 3], ["Deadlines", "impromptu", 2],
  ["Breakfast", "impromptu", 1], ["Weekends", "impromptu", 1], ["Habits", "impromptu", 2], ["Clocks", "impromptu", 3], ["Teamwork", "impromptu", 2], ["Change", "impromptu", 3],
  ["Phones", "impromptu", 1], ["Shoes", "impromptu", 2], ["Gardens", "impromptu", 2], ["Luck", "impromptu", 3], ["Neighbors", "impromptu", 2], ["First jobs", "impromptu", 1]
].map(([t, k, d], i) => ({ id: i, t, k, d }));

export const CURVEBALLS = {
  opinion: ["What's the strongest argument against your view?", "What would change your mind?", "Who loses if you're right?"],
  recommendation: ["What's the biggest risk in your plan?", "What if you had half the budget?", "What would you do in the first week?"],
  explainer: ["Why should a busy executive care about this?", "Can you give me a real example?", "What do most people get wrong about it?"],
  story: ["What would you do differently now?", "What did the other person think?", "How did that change how you work?"],
  trend: ["What's one sign that would prove you wrong?", "Who wins and who loses from this?", "What happens in five years?"],
  pitch: ["What's the bear case?", "Why hasn't someone already done this?", "Why now?"],
  impromptu: ["Give me one more example.", "Why does that matter to you personally?", "What's the opposite view?"]
};

export const EMOTIONS = ["Happy", "Sad", "Angry", "Surprised", "Disgusted", "Afraid"];
export const TWISTERS = [
  "Red lorry, yellow lorry.",
  "She sells seashells by the seashore.",
  "Peter Piper picked a peck of pickled peppers.",
  "Unique New York, you know you need unique New York.",
  "Six slippery snails slid slowly seaward.",
  "Truly rural, truly rural.",
  "A proper copper coffee pot.",
  "Thin sticks, thick bricks.",
  "Which wristwatches are Swiss wristwatches?",
  "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",
  "Lesser leather never weathered wetter weather better.",
  "Fred fed Ted bread, and Ted fed Fred bread."
];
export const FILLERS = ["um", "uh", "erm", "like", "you know", "basically", "actually", "literally", "kind of", "sort of", "i mean", "you see"];
