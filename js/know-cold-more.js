// Know Cold cards 18-50. Same shape and the same evergreen rule as curriculum.js.
export const MORE_TOPICS = {
  hockey: { label: "Hockey", months: [10, 11, 12, 1, 2, 3, 4, 5, 6] },
  f1: { label: "Formula 1", months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  olympics: { label: "The Olympics", months: [] },
  skiing: { label: "Skiing and ski trips", months: [11, 12, 1, 2, 3, 4] },
  halloween: { label: "Halloween", months: [10] },
  fall_season: { label: "Fall in America", months: [9, 10, 11] },
  spring_season: { label: "Spring and spring break", months: [3, 4, 5] },
  pto: { label: "Vacation and time off", months: [] },
  chicago: { label: "Chicago", months: [] },
  boston: { label: "Boston", months: [] },
  california: { label: "California", months: [] },
  texas: { label: "Texas", months: [] },
  pets: { label: "Pets", months: [] },
  family: { label: "Family and kids", months: [] },
  weddings: { label: "Weddings", months: [4, 5, 6, 7, 8, 9, 10] },
  regional_food: { label: "American regional food", months: [] },
  happy_hour: { label: "Happy hour and drinks", months: [] },
  music: { label: "Music and concerts", months: [] },
  movies: { label: "Movies and awards", months: [] },
  podcasts_books: { label: "Podcasts and books", months: [] },
  cars: { label: "Cars and road trips", months: [] },
  national_parks: { label: "National parks and the outdoors", months: [] },
  housing: { label: "Apartments and moving", months: [] },
  business_travel: { label: "Business travel", months: [] },
  points: { label: "Credit card points and travel hacks", months: [] },
  office_life: { label: "Office life", months: [] },
  career_stories: { label: "Career stories", months: [] },
  client_dinners: { label: "Client dinners", months: [] },
  office_idioms: { label: "Office idioms", months: [] },
  humor: { label: "American humor and sarcasm", months: [] },
  compliments: { label: "Compliments and thanks", months: [] },
  names: { label: "Names and introductions", months: [] },
  weather: { label: "Weather talk", months: [] }
};

export const MORE_CARDS = [
  { key: "hockey", topic: "hockey", title: "Hockey (NHL)",
    when: "October to June, and in any northern city or in Tampa.",
    essentials: [
      "32 NHL teams. The regular season runs October to April, and the playoffs run into June. The trophy is the Stanley Cup.",
      "The playoffs are the best part: long series, overtime games and very loud arenas. Casual fans tune in then.",
      "New York-area teams: the Rangers (Madison Square Garden), the Islanders and the New Jersey Devils. Tampa has the Lightning.",
      "A hat trick is three goals by one player, and fans throw hats on the ice to celebrate it.",
      "It's fast and physical. Going to a live game is the easiest way to get into it, even if you don't follow the league."
    ],
    ask: ["Do you follow hockey?", "Have you been to a game in person?", "Who's your team?"],
    bridge: "“I've never watched a game live. Is it as fast in person as it looks?”",
    avoid: ["Calling it “ice soccer”", "Pretending to know the rules"] },

  { key: "soccer_us", topic: "soccer", title: "Soccer, American style",
    when: "Any time, especially during the World Cup or Champions League season.",
    essentials: [
      "Americans say soccer. “Football” means the NFL, so say soccer to avoid confusion.",
      "Many finance people follow the English Premier League, often because of a study-abroad year or a London office. The season runs August to May.",
      "MLS is the US league. Inter Miami signed Lionel Messi in 2023, which brought a lot of new American fans.",
      "The UEFA Champions League is the top European club competition, with games on weekday afternoons in US time zones.",
      "The 2026 World Cup was hosted by the US, Canada and Mexico, and it got many Americans watching who never had before."
    ],
    ask: ["Do you follow any teams?", "Premier League or more of a World Cup fan?", "How'd you get into it?"],
    bridge: "If soccer is your sport, lead with it. It's a real conversation in finance, and you'll know more than most people.",
    avoid: ["Correcting someone for saying “soccer”"] },

  { key: "tennis", topic: "tennis", title: "Tennis and the Grand Slams",
    when: "The US Open in late summer, Wimbledon in July, and with anyone who plays.",
    essentials: [
      "The four Grand Slams: the Australian Open (January), the French Open on clay (May to June), Wimbledon on grass (late June to July) and the US Open on hard courts (late August to September).",
      "The US Open is in Queens, New York, and going to a session is a classic late-summer outing.",
      "Scoring: love means zero, then 15, 30, 40, game. Deuce means 40-40.",
      "Lots of professionals play at clubs or on public courts on weekends. Tennis and pickleball invites are common.",
      "Wimbledon traditions people mention: players wearing all white, and strawberries and cream."
    ],
    ask: ["Do you play?", "Have you been to the US Open?", "Where do you usually play?"],
    bridge: "If you play any racket sport, say so. It's one of the easiest ways to turn small talk into an invitation.",
    avoid: ["Overstating your level before someone invites you to play"] },

  { key: "f1", topic: "f1", title: "Formula 1",
    when: "Race weekends from March to December, and with younger finance people.",
    essentials: [
      "F1 got big in the US largely through the Netflix series Drive to Survive.",
      "There are three US races: Austin (Circuit of the Americas), Miami and Las Vegas.",
      "Ten teams with two drivers each. Fans talk about teams like Ferrari, Mercedes, McLaren and Red Bull as much as about drivers.",
      "Race weekends include practice sessions, qualifying on Saturday and the race on Sunday, often early morning in US time zones.",
      "A lot of people follow the drama more than the racing, so asking about the show works fine."
    ],
    ask: ["Did you get into it through Drive to Survive?", "Do you have a team?", "Would you ever go to the Miami or Vegas race?"],
    bridge: "“I watched a season of Drive to Survive and got hooked on the team drama. Do you follow it?”",
    avoid: ["Spoiling a race for someone who watches it later"] },

  { key: "olympics", topic: "olympics", title: "The Olympics",
    when: "Every two years, alternating Summer and Winter Games, and for weeks of office chatter around them.",
    essentials: [
      "The Summer and Winter Games each come every four years, staggered so there's an Olympics every two years.",
      "Los Angeles hosts the 2028 Summer Olympics, so that's a common upcoming topic.",
      "Americans watch the big events together: swimming, gymnastics and track in summer; figure skating, skiing and hockey in winter.",
      "The medal count by country is a running conversation, and people get patriotic about it.",
      "It's a safe, positive topic for everyone, including people who don't follow sports otherwise."
    ],
    ask: ["Are you watching any of the Olympics?", "What's your favorite event to watch?", "Would you go to LA in 2028?"],
    bridge: "Your home country's athletes are a great angle: “I was cheering for [country] in [sport]. Do you have a favorite event?”",
    avoid: ["Political arguments about host countries"] },

  { key: "fantasy", topic: "fantasy_football", title: "Fantasy football",
    when: "Late August through December, every Monday and Tuesday.",
    essentials: [
      "Friends or coworkers form a league, draft real NFL players in late August or early September, and score points based on their real stats each week.",
      "Each week you play one other person in your league. Trash talk is part of the fun.",
      "Terms you'll hear: the draft, the waiver wire (picking up free players), trades, starting lineup and “PPR” (points per reception).",
      "Office leagues are common in finance, and joining one is an easy way to bond with a team.",
      "People love explaining their bad luck. Asking “How's your team doing?” gets a long answer."
    ],
    ask: ["Are you in a fantasy league?", "How's your team looking this week?", "Who'd you draft first?"],
    bridge: "“I've never played but I'm thinking about joining our office league. How hard is it to pick up?”",
    avoid: ["Talking for ten minutes about your own team"] },

  { key: "skiing", topic: "skiing", title: "Skiing and ski trips",
    when: "December through April, around winter breaks and long weekends.",
    essentials: [
      "Finance people ski a lot. Big destinations: Colorado (Vail, Aspen), Utah (Park City), Vermont and Lake Tahoe.",
      "Most resorts are on one of two season passes, Epic or Ikon. “Are you Epic or Ikon?” is a real question.",
      "Ski trips over Presidents' Day weekend (February) and spring break are common.",
      "People talk about snow conditions, “powder days,” and whether they ski or snowboard.",
      "Never skied? Saying so is fine, and people often offer advice or an invitation."
    ],
    ask: ["Do you ski or snowboard?", "Where's your favorite place to go?", "Any trips planned this winter?"],
    bridge: "“I've never skied, which feels like a gap in my American education. Where should a beginner start?”",
    avoid: ["Bragging about which resorts you can afford"] },

  { key: "halloween", topic: "halloween", title: "Halloween",
    when: "Throughout October, and the days around October 31.",
    essentials: [
      "October 31. Costumes, candy, carved pumpkins (jack-o'-lanterns) and kids trick-or-treating door to door.",
      "Offices sometimes have costume contests, and adults go to Halloween parties the weekend before.",
      "People ask about your costume, and group or pop-culture costumes get a laugh.",
      "Haunted houses, horror movies and pumpkin patches are all part of the season.",
      "Some people go all in and some skip it. Both are normal."
    ],
    ask: ["Are you dressing up this year?", "What was your costume?", "Any good Halloween plans?"],
    bridge: "“Halloween wasn't really a thing where I grew up, so I'm still learning the costume game. What are you going as?”",
    avoid: ["Costumes based on someone's culture or religion"] },

  { key: "fall", topic: "fall_season", title: "Fall in America",
    when: "September through November.",
    essentials: [
      "Fall (rarely “autumn” in everyday speech) is a favorite season for many Americans.",
      "In the Northeast, the leaves change color. “Leaf peeping” trips to Vermont, upstate New York or New England are popular.",
      "The pumpkin spice latte from Starbucks is a running joke and a real seasonal obsession.",
      "Apple picking, pumpkin patches, cider and doughnuts, plus football season, Halloween and Thanksgiving.",
      "“Sweater weather” means cool enough for a sweater, and people say it happily."
    ],
    ask: ["Do you do anything fall-ish, like apple picking?", "Big pumpkin spice fan?", "Is fall your favorite season?"],
    bridge: "In Florida, joke about the weather: “Fall here just means it's 85 instead of 95.”",
    avoid: ["Spending too long on weather"] },

  { key: "spring", topic: "spring_season", title: "Spring and spring break",
    when: "March through May.",
    essentials: [
      "Spring break is a week off school, usually in March. College students head to beaches like Miami or Cancun.",
      "Easter falls in March or April, and some families celebrate with egg hunts and a big meal.",
      "Seasonal allergies are a common complaint. “My allergies are killing me” gets instant sympathy.",
      "Spring brings March Madness, baseball's Opening Day and the Masters, so sports talk peaks.",
      "Tax Day is usually April 15, and people complain about filing taxes."
    ],
    ask: ["Any spring break plans?", "Do you do anything for Easter?", "Are your allergies as bad as mine?"],
    bridge: "“My spring break is mostly studying, but I'm sneaking in a beach day. Do you take time off this time of year?”",
    avoid: ["Wild spring break stories with colleagues"] },

  { key: "pto", topic: "pto", title: "Vacation and time off",
    when: "Before and after holidays, Fridays, and when anyone mentions being out.",
    essentials: [
      "PTO means paid time off. “I'm taking PTO next week” or “I'll be OOO” (out of office).",
      "Americans get less vacation than many countries, often two or three weeks a year, so people plan it carefully.",
      "Some companies offer “unlimited PTO,” which in practice often means people take less.",
      "“Are you taking any time off?” and “How was your time off?” are standard questions.",
      "In finance, a vacation can be interrupted by work. People talk about “fully unplugging” as a goal."
    ],
    ask: ["Are you taking any time off soon?", "Where are you headed?", "Were you able to fully unplug?"],
    bridge: "“I'm saving my days for a trip home. Do you have anything planned?”",
    avoid: ["Making someone feel guilty for taking time off"] },

  { key: "chicago", topic: "chicago", title: "Chicago",
    when: "When you meet someone from the Midwest, or anyone with a Chicago office.",
    essentials: [
      "Nickname: the Windy City. Winters are very cold, and locals are proud of surviving them.",
      "Food: deep-dish pizza, and the Chicago-style hot dog, which is never topped with ketchup.",
      "Baseball split: the Cubs (Wrigley Field, North Side) and the White Sox (South Side). The NFL team is the Bears.",
      "Tourist favorites: the architecture boat tour, the Bean (Cloud Gate) and Lake Michigan beaches in summer.",
      "Big finance city: trading firms, futures exchanges (CME) and a large banking presence."
    ],
    ask: ["Are you from Chicago originally?", "Cubs or Sox?", "Deep dish: overrated or great?"],
    bridge: "“I've only been to Chicago in [season]. What's the one thing a visitor shouldn't miss?”",
    avoid: ["Asking for ketchup on a Chicago hot dog"] },

  { key: "boston", topic: "boston", title: "Boston",
    when: "With anyone from New England, and around the Boston Marathon or the Red Sox.",
    essentials: [
      "Sports-crazy city: the Red Sox (Fenway Park), Patriots, Celtics and Bruins.",
      "The Red Sox and Yankees have a famous rivalry, so be careful picking sides with a Bostonian.",
      "The Boston Marathon is on Patriots' Day, a Monday in April.",
      "College town: Harvard, MIT, Boston College, Boston University and Northeastern are all in the area.",
      "Local quirks: a strong accent, Dunkin' coffee loyalty, and “wicked” meaning very."
    ],
    ask: ["Are you a Boston native?", "Have you been to a game at Fenway?", "Where'd you go to school up there?"],
    bridge: "“I've heard Fenway is the best ballpark to see a game in. Is that true?”",
    avoid: ["Saying you're a Yankees fan as an opener with a Bostonian"] },

  { key: "california", topic: "california", title: "California: the Bay Area and LA",
    when: "With anyone in tech, venture capital or entertainment, and with Californians.",
    essentials: [
      "The Bay Area (San Francisco, Silicon Valley) is the center of tech and venture capital.",
      "Los Angeles means entertainment, beaches and famously bad traffic. People measure distance in minutes, not miles.",
      "Northern and Southern California have a friendly rivalry over weather, food and attitude.",
      "In-N-Out Burger is a cultural touchstone. Ask someone their order.",
      "San Francisco is foggy and cool even in summer. Visitors who pack shorts regret it."
    ],
    ask: ["NorCal or SoCal?", "Do you miss the weather?", "What's your In-N-Out order?"],
    bridge: "“I've never been to the West Coast. If I had one weekend, SF or LA?”",
    avoid: ["Assuming everyone in California works in tech or film"] },

  { key: "texas", topic: "texas", title: "Texas",
    when: "With anyone from Dallas, Houston or Austin, which includes a growing number of finance people.",
    essentials: [
      "Big cities: Dallas, Houston, Austin (the capital) and San Antonio. Texans are proud and will tell you so.",
      "Finance has grown fast in Dallas, sometimes nicknamed “Y'all Street.” Texas has no state income tax.",
      "Food: brisket barbecue and Tex-Mex. Asking for a barbecue recommendation is always welcome.",
      "Football everywhere, from high school (think Friday Night Lights) to the Cowboys.",
      "Austin hosts SXSW every March, a big music, film and tech festival."
    ],
    ask: ["Which part of Texas are you from?", "Best barbecue spot?", "Do you think you'll move back?"],
    bridge: "“Everyone says Texas barbecue ruins all other barbecue for you. Where should I go first?”",
    avoid: ["Texas stereotypes about cowboys and horses"] },

  { key: "pets", topic: "pets", title: "Pets",
    when: "Whenever someone mentions a dog or cat, or has one as their phone background.",
    essentials: [
      "Americans treat pets as family, and dog owners especially love talking about them.",
      "Ask the pet's name, breed and age. Asking to see a photo is a compliment.",
      "Dog parks, walkers, adopting from shelters (“rescue dogs”) and pet-friendly offices are common topics.",
      "Some people are cat people and some are dog people. It's a light, friendly debate.",
      "Pet loss is real grief. If someone mentions it, respond the way you would to any loss."
    ],
    ask: ["What's their name?", "Do you have a picture?", "How old is she?"],
    bridge: "No pets? “I grew up with a dog, and I miss having one. Tell me about yours.” Or just ask for the photo.",
    avoid: ["Criticizing someone's pet or breed", "Calling a pet “it” after hearing its name"] },

  { key: "family", topic: "family", title: "Family and kids",
    when: "When a colleague mentions their kids, partner or parents.",
    essentials: [
      "Follow their lead. If someone mentions their kids, ask about them. If they don't, don't pry.",
      "Good questions: how old they are, what they're into, and how school or sports are going.",
      "Remember details. “How did your son's tournament go?” next week shows real attention.",
      "Many parents in finance juggle long hours. A little sympathy about bedtime or school pickups goes a long way.",
      "“Partner” is a safe, neutral word when you don't know someone's spouse."
    ],
    ask: ["How old are your kids now?", "What are they into these days?", "Are they in any sports?"],
    bridge: "Talk about your own family if it fits: “My parents are back home, so I call them every Sunday.”",
    avoid: ["Asking why someone doesn't have kids", "Asking when someone is getting married"] },

  { key: "weddings", topic: "weddings", title: "Weddings and engagements",
    when: "Spring through fall, and any time someone is engaged.",
    essentials: [
      "Wedding season peaks from late spring to fall, and many people go to several weddings a year.",
      "When someone gets engaged, say congratulations and ask how the proposal happened. People love telling that story.",
      "Bachelor and bachelorette parties are pre-wedding trips with friends, often in places like Nashville, Austin or Miami.",
      "Gifts usually come from the couple's registry, a list of things they've asked for.",
      "Destination weddings mean travel, so “Where's the wedding?” is a natural question."
    ],
    ask: ["Congratulations! How did the proposal happen?", "Have you set a date?", "Where's the wedding going to be?"],
    bridge: "“Weddings back home are huge, with hundreds of guests. Are American weddings smaller?”",
    avoid: ["Asking about the cost", "Asking who's not invited"] },

  { key: "regional_food", topic: "regional_food", title: "American regional food",
    when: "Lunch, travel talk, and meeting someone from a different part of the country.",
    essentials: [
      "Barbecue styles are a real debate: Texas (beef brisket), Kansas City (sweet sauce), the Carolinas (pulled pork, vinegar sauce) and Memphis (ribs).",
      "Pizza rivalry: New York (thin, foldable slices) against Chicago (deep dish).",
      "Regional icons: the Philly cheesesteak, Maine lobster rolls, Southern fried chicken and biscuits, and Tex-Mex.",
      "Everyone thinks their hometown has the best version of something. Ask, and let them win.",
      "“What's the food you miss most from home?” is a warm question for anyone who has moved."
    ],
    ask: ["What's the best thing to eat where you're from?", "Which barbecue style wins?", "New York or Chicago pizza?"],
    bridge: "“I'm working my way through American regional food. What should be next on my list?”",
    avoid: ["Insulting someone's hometown food"] },

  { key: "happy_hour", topic: "happy_hour", title: "Happy hour and drinks",
    when: "After work, team events and client outings.",
    essentials: [
      "Happy hour means after-work drinks, often at a nearby bar, sometimes at a discount.",
      "Ordering a non-alcoholic drink is completely fine. Nobody needs a reason.",
      "Know your limit. Being the most sober person at a work event is never a problem.",
      "“What are you drinking?” is an easy opener, and offering to buy someone's next drink is friendly.",
      "Leave gracefully: “I'm going to head out, but this was great. See you tomorrow.”"
    ],
    ask: ["What are you drinking?", "Have you been here before?", "Is this the usual spot for the team?"],
    bridge: "“I'm not much of a drinker, so I'm on club soda, but I wouldn't miss the team hangout.”",
    avoid: ["Pressuring anyone to drink", "Talking shop too loudly in a public bar"] },

  { key: "music", topic: "music", title: "Music and concerts",
    when: "Mondays after concert weekends, festival season, and Spotify Wrapped in December.",
    essentials: [
      "“Have you been to any good concerts lately?” works with almost anyone.",
      "Festivals: Coachella (California, April), Lollapalooza (Chicago, summer) and Governors Ball (New York).",
      "Stadium tours and ticket prices are a shared complaint.",
      "Spotify Wrapped comes out in early December, and people share their top artists.",
      "Musical taste is personal. Show curiosity rather than judgment."
    ],
    ask: ["What have you been listening to lately?", "Seen anyone good live?", "What was the best concert you've ever been to?"],
    bridge: "Share music from home: “I'll send you a song from an artist I grew up with. You'd never hear it on the radio here.”",
    avoid: ["Mocking someone's favorite artist"] },

  { key: "movies", topic: "movies", title: "Movies and awards season",
    when: "Mondays, summer blockbuster season, and January through March awards season.",
    essentials: [
      "“Seen anything good lately?” covers movies and shows.",
      "Awards season: the Golden Globes in January and the Oscars in late winter or early spring.",
      "Summer means big blockbusters, and holiday weekends bring big releases.",
      "People enjoy recommending movies, so asking for one is an easy move.",
      "Finance favorites people reference: The Big Short, Margin Call, The Wolf of Wall Street."
    ],
    ask: ["Seen anything good lately?", "Did you watch the Oscars?", "What's the last movie you really loved?"],
    bridge: "“I just watched Margin Call. Is it realistic?” gets a great reaction from finance people.",
    avoid: ["Spoilers"] },

  { key: "podcasts_books", topic: "podcasts_books", title: "Podcasts and books",
    when: "Commute talk, and with people who say they learned something somewhere.",
    essentials: [
      "Podcasts are huge on commutes. “Listening to anything good?” is a common question.",
      "Finance-world podcasts include Bloomberg's Odd Lots, Acquired (company histories) and Invest Like the Best.",
      "Classic finance books people mention: Liar's Poker, Barbarians at the Gate and The Big Short.",
      "Asking for a recommendation, then actually following up, builds a relationship.",
      "Keep it light: one recommendation and why, not a book report."
    ],
    ask: ["Listening to anything good these days?", "Read anything good lately?", "What would you recommend to someone new to the industry?"],
    bridge: "Follow up later: “I started the podcast you mentioned. The episode on [topic] was great.”",
    avoid: ["Pretending to have read something you haven't"] },

  { key: "cars", topic: "cars", title: "Cars, commutes and road trips",
    when: "Outside New York especially, and before long weekends.",
    essentials: [
      "Outside a few big cities, most Americans drive everywhere, and cars are part of identity.",
      "Road trips are a classic American experience: Route 66, the Pacific Coast Highway, national parks.",
      "Commute talk is universal: traffic, tolls, gas prices and parking.",
      "In New York, people talk about the subway and the trains (Metro-North, LIRR, NJ Transit) instead.",
      "Electric cars and Teslas come up a lot, sometimes as a debate."
    ],
    ask: ["How's your commute?", "Ever done a big road trip?", "What would be your dream road trip?"],
    bridge: "“I've never done a real American road trip. Which one should be first?”",
    avoid: ["Judging what someone drives"] },

  { key: "national_parks", topic: "national_parks", title: "National parks and the outdoors",
    when: "Summer vacation talk, long weekends and with anyone outdoorsy.",
    essentials: [
      "Yellowstone, established in 1872, was the first national park in the world.",
      "Famous parks: the Grand Canyon, Yosemite, Zion and the Great Smoky Mountains (the most visited).",
      "Hiking, camping and “getting outside” are popular weekend activities.",
      "In the Northeast, people go upstate or to the Catskills, Adirondacks or White Mountains.",
      "“What's your favorite park?” is a great question for people who travel."
    ],
    ask: ["Have you been to any national parks?", "Do you hike much?", "What's on your bucket list?"],
    bridge: "“The Grand Canyon is at the top of my list. Have you been?”",
    avoid: ["Overstating how outdoorsy you are"] },

  { key: "housing", topic: "housing", title: "Apartments and moving",
    when: "With new hires, interns and anyone who just moved.",
    essentials: [
      "“Where are you living?” means which neighborhood, and it leads to commute and food talk.",
      "Apartment hunting stories are relatable: competition, brokers, roommates and tiny kitchens.",
      "Moving to the suburbs comes up with people starting families.",
      "Rent and home prices are common complaints in general terms. Specific numbers usually stay private.",
      "Asking for neighborhood tips is a great way to start a longer conversation."
    ],
    ask: ["Where are you living now?", "How do you like the neighborhood?", "Any tips for apartment hunting?"],
    bridge: "“I'm figuring out where to live for the summer. Which neighborhood would you pick?”",
    avoid: ["Asking how much someone pays in rent or for their house"] },

  { key: "business_travel", topic: "business_travel", title: "Business travel",
    when: "Before and after trips, in airports and on the first call after someone travels.",
    essentials: [
      "“How was your flight?” is the standard opener after anyone travels.",
      "TSA PreCheck and Global Entry speed up security and customs, and frequent travelers swear by them.",
      "Airline status and loyalty programs are serious business to frequent flyers.",
      "Delays, red-eyes (overnight flights) and lost luggage make easy shared complaints.",
      "Asking for local recommendations before someone's trip is thoughtful."
    ],
    ask: ["How was the flight?", "Do you travel a lot for work?", "Any tips for the city you were in?"],
    bridge: "“I'm still new to work travel. Any tips for surviving a red-eye?”",
    avoid: ["Complaining about the trip to the person who organized it"] },

  { key: "points", topic: "points", title: "Credit card points and travel hacks",
    when: "Travel talk with finance people, who often treat this as a hobby.",
    essentials: [
      "Many finance people are into credit card points: earning rewards and spending them on flights and hotels.",
      "Premium travel cards come with airport lounge access, which people love talking about.",
      "“Travel hacking” means stacking points and miles to travel cheaply or fly business class.",
      "Airline alliances and hotel programs matter to frequent travelers.",
      "It's a nerdy topic, but asking someone to explain their strategy gets a happy, long answer."
    ],
    ask: ["Are you into points?", "What's the best redemption you've ever gotten?", "Which card would you start with?"],
    bridge: "“I keep hearing about points. If you were starting from zero, what would you do first?”",
    avoid: ["Talking about credit card debt or anyone's credit score"] },

  { key: "office_life", topic: "office_life", title: "Office life",
    when: "Daily, especially Mondays, Fridays and in the elevator or kitchen.",
    essentials: [
      "“How's your week going?” and “Busy day?” are the default office openers.",
      "Hybrid schedules and return-to-office policies are common topics. Keep opinions mild.",
      "Slack or Teams messages, back-to-back meetings and lunch orders are shared experiences.",
      "Friday mood is real: “Any plans for the weekend?” and “Almost there” on Friday afternoon.",
      "Small kindnesses, like holding the elevator or bringing snacks, count for a lot."
    ],
    ask: ["How's your week going?", "Busy day?", "Are you in the office most days?"],
    bridge: "Comment on something shared: “That all-hands ran long. Did you make it to lunch?”",
    avoid: ["Complaining about your manager", "Gossip"] },

  { key: "career_stories", topic: "career_stories", title: "Career stories",
    when: "Coffee chats, networking and any first conversation with someone senior.",
    essentials: [
      "“How did you end up in your role?” is the best question in finance networking. People enjoy telling their story.",
      "Follow-ups matter: ask what surprised them, what they'd do differently, or what made them switch.",
      "Most careers aren't straight lines. Asking about pivots shows real interest.",
      "Have your own short version ready: where you started, what you've done, and what you want next, in 30 seconds.",
      "End with something specific: “That's really helpful, especially the part about [detail].”"
    ],
    ask: ["How did you end up in this group?", "What surprised you most about the job?", "What would you tell yourself at my stage?"],
    bridge: "Connect their story to yours: “That's similar to how I got interested. My first exposure was [your story].”",
    avoid: ["Asking for a job in the first five minutes", "Interrupting their story to tell yours"] },

  { key: "client_dinners", topic: "client_dinners", title: "Client dinners",
    when: "Team and client dinners, especially as a junior person.",
    essentials: [
      "Follow the host's lead. Order in the same price range, and don't pick the most expensive item.",
      "Phone away, attentive listening, and small talk first: business comes later in the meal, if at all.",
      "Drinks: match the table's pace or less. A non-alcoholic choice is fine.",
      "In the US, tips are usually 18 to 20 percent, but the host handles the bill at a client dinner.",
      "Send a short thank-you note the next day, mentioning one thing you talked about."
    ],
    ask: ["Have you been here before?", "What do you recommend?", "How long have you two worked together?"],
    bridge: "Ask about the relationship: “How did you first start working with the team?” It invites a good story.",
    avoid: ["Talking about confidential deals in public", "Checking your phone at the table"] },

  { key: "office_idioms", topic: "office_idioms", title: "Office idioms",
    when: "Every meeting and email. You'll hear these daily.",
    essentials: [
      "“Circle back” and “touch base” mean to talk again later or check in briefly.",
      "“Move the needle” means make a noticeable difference. “Low-hanging fruit” means easy wins.",
      "“Bandwidth” means time or capacity: “I don't have the bandwidth this week.”",
      "“Take it offline” means discuss it separately, outside this meeting. “Ping me” means message me.",
      "Watch out: in US business, “table it” means postpone it. “Out of pocket” in business usually means unreachable."
    ],
    ask: ["Can we circle back on this tomorrow?", "Do you have bandwidth for this?", "Should we take this offline?"],
    bridge: "Use them lightly. One or two per conversation sounds natural; five sounds like a parody.",
    avoid: ["Stacking jargon", "Using an idiom you're unsure of in front of senior people"] },

  { key: "humor", topic: "humor", title: "American humor and sarcasm",
    when: "Everywhere, and especially with teams that know each other well.",
    essentials: [
      "Americans use a lot of self-deprecating humor: joking about themselves first.",
      "Sarcasm depends on tone. “Oh great, another meeting” means the opposite of great.",
      "Light teasing between colleagues is often a sign they like each other.",
      "“I'm dying” or “that's hilarious” means something was very funny. It's not literal.",
      "When unsure, smile and play along. Asking “Wait, are you serious?” with a smile is also fine."
    ],
    ask: ["Wait, are you serious?", "Okay, that's actually hilarious.", "You're kidding, right?"],
    bridge: "Your own light self-deprecating joke is the safest humor: “My American football knowledge is still at a third-grade level.”",
    avoid: ["Jokes about anyone's appearance, background or religion", "Sarcasm in writing, where tone gets lost"] },

  { key: "compliments", topic: "compliments", title: "Compliments and thanks",
    when: "After presentations, when someone helps you, and in daily office life.",
    essentials: [
      "Americans compliment often and specifically: “Great job on that deck, the summary page was really clear.”",
      "Accept compliments simply: “Thank you, I appreciate that.” Don't deflect too hard.",
      "Thank people for specific help, and mention it to their manager when it was real work.",
      "A short thank-you email after a coffee chat or a dinner is expected, ideally within a day.",
      "Compliment choices (shoes, a bag, a book on their desk), not bodies."
    ],
    ask: ["Where did you get that? It's great.", "That presentation was really clear. How long did it take?", "Thanks again for the help yesterday."],
    bridge: "“Thanks so much for walking me through that model. It made the rest of the week much easier.”",
    avoid: ["Over-the-top praise that sounds fake", "Comments on weight or appearance"] },

  { key: "names", topic: "names", title: "Names and introductions",
    when: "Every first meeting and every networking event.",
    essentials: [
      "Say the person's name back right away: “Nice to meet you, Sarah.” It helps you remember it.",
      "Forgot a name? “I'm so sorry, remind me of your name?” is completely normal.",
      "Most Americans go by first names at work, even with senior people, unless they introduce themselves otherwise.",
      "If your name is hard for Americans, give an easy way to say it, or a nickname if you prefer one.",
      "Introduce people to each other with a hook: “Sarah, this is Mike. He also went to Michigan.”"
    ],
    ask: ["Sorry, how do you pronounce your name?", "Do you go by Michael or Mike?", "Have you two met?"],
    bridge: "Make your own name easy: “It's [name], like [easy comparison].”",
    avoid: ["Pretending you remember a name you don't", "Shortening someone's name without asking"] },

  { key: "weather", topic: "weather", title: "Weather talk",
    when: "Every elevator, every call that starts early, every Monday.",
    essentials: [
      "Weather is the universal opener, but it's only an opener. Use it to get to something more interesting.",
      "Extremes work best: a heat wave, a snowstorm, a hurricane warning or a perfect spring day.",
      "Weekend weather leads naturally to plans: “It's supposed to be beautiful Saturday. Doing anything outside?”",
      "On calls with other cities, ask what it's like there. It's an easy way to start.",
      "Americans use Fahrenheit. Know that 70°F is pleasant, 90°F is hot and 32°F is freezing."
    ],
    ask: ["How's the weather up there?", "Did you get hit by the storm?", "Doing anything outside this weekend?"],
    bridge: "Turn it into a question about them: “At least it's nice out. Any plans to take advantage of it?”",
    avoid: ["Five minutes on the weather", "Climate politics with people you just met"] }
];
