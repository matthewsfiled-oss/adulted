// Adulted content: modules, step-by-step guides, panic guides, checklists, plans and prices.
// Shared by the app (browser) and the server (Node). Edit here, then run: node scripts/build-web.js
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else Object.assign(root, factory());
})(typeof self !== "undefined" ? self : this, function () {

  /* Prices and limits. paymentsLive stays false until Google Play billing is hooked up. */
  const CONFIG = {
    paymentsLive: false,
    silverMonthly: 6.99, silverYearly: 49.99,
    goldMonthly: 14.99, goldYearly: 119.99,
    studentSilverYearly: 29.99, familyGoldYearly: 179.99,
    askPerDay: { free: 3, silver: 30, gold: 200 },
    snapPerDay: { free: 2, silver: 20, gold: 100 }, // free gets 2 a day during the beta, before paid plans open
    supportEmail: "matthewsfiled@gmail.com",
    siteUrl: "https://adulted.onrender.com",
  };

  /* What each plan includes. live:false means it's on the roadmap, shown as "Coming soon". */
  const TIERS = [
    { id: "free", n: "Free", price: "$0", note: "Everything you need to get through the day",
      has: [["Every step-by-step guide with pictures", true], ["Panic button and emergency help", true], ["First Apartment checklist", true], ["3 Ask Anything questions a day", true], ["2 Snap and Solve photos a day (beta)", true], ["Benefits Finder and Resource Directory", false], ["Meal Library and shopping lists", true]] },
    { id: "silver", n: "Silver", price: "$6.99/mo", alt: "or $49.99/yr", note: "For running your life without the guesswork",
      has: [["Everything in Free", true], ["30 Ask Anything questions a day", true], ["Snap and Solve: 20 photos a day", true], ["Document vault with renewal reminders", false], ["Full State Move Planner", false], ["Bill Check and homeownership tools", false]] },
    { id: "gold", n: "Gold", price: "$14.99/mo", alt: "or $119.99/yr", note: "The app handles the hard parts for you",
      has: [["Everything in Silver", true], ["Unlimited Ask Anything", true], ["Document Explainer for leases and contracts", false], ["Bank Link and Leak Finder", false], ["Book It For Me with no success fee", false], ["Doctor wait times and AI office calls", false]] },
  ];
  const ONE_TIME = [["Document Explainer (one lease, contract, or policy)", 2.99], ["Snap and Solve pack (5 photos)", 1.99], ["Full State Move Planner for one move", 9.99], ["Book It For Me (one job)", 4.99], ["One-time money checkup", 4.99], ["24-hour Gold pass", 3.99]];
  const TOPUPS = [["25 extra Ask Anything questions", 1.99], ["10 extra Snap and Solve photos", 1.99]];

  /* The six modules. Only Home is live in this first build. */
  const MODULES = [
    { id: "home", n: "Home", blurb: "Laundry, cleaning, and fixing things before they get expensive", live: true },
    { id: "money", n: "Money", blurb: "Paychecks, budgets, credit, and avoiding fees", live: true },
    { id: "living", n: "Living on your own", blurb: "Leases, deposits, utilities, and roommates", live: true },
    { id: "food", n: "Food", blurb: "Grocery shopping, cooking, recipes, and food safety", live: true },
    { id: "health", n: "Health and admin", blurb: "Doctors, insurance, and important paperwork", live: true },
    { id: "car", n: "Car", blurb: "Oil, tires, jump starts, and what to do after a crash", live: true },
  ];

  /* Guides. Each step: t = title, d = one short line, more = optional detail, v = illustration key.
     level: 1 easy, 2 takes care, 3 call a pro if it goes wrong. */
  const GUIDES = {
    laundry: {
      n: "Do a load of laundry", mod: "home", cat: "Laundry", time: "About 10 minutes of your time", level: 1,
      tools: ["Detergent", "A laundry basket"],
      steps: [
        { t: "Check the tags", d: "Look for anything that says hand wash or dry clean only, and set it aside.", more: "Not sure what the symbols mean? Open the care label guide from the end of this guide.", v: "label" },
        { t: "Sort into piles", d: "Darks, lights, and whites. Wash towels and jeans apart from thin shirts.", more: "New dark or red clothes can bleed color the first few washes, so keep them with darks.", v: "sort", img: "laundry-2.jpg", alt: "Hands sorting clothes into piles on the floor" },
        { t: "Empty pockets", d: "Pull out tissues, pens, and cash. Zip zippers and close hooks.", more: "One forgotten tissue leaves lint on the whole load. A pen can ruin it.", v: "pockets", img: "laundry-3.jpg", alt: "A hand reaching into a jeans pocket" },
        { t: "Load it loosely", d: "Fill the drum about three-quarters full. Clothes need room to move.", more: "An overstuffed washer doesn't get clothes clean and can damage the machine.", v: "load", img: "laundry-4.jpg", alt: "Loading clothes into a front-loading washer" },
        { t: "Add detergent", d: "Pods go in the drum before the clothes. Liquid goes in the dispenser, filled to the line on the cap.", more: "If your washer has the HE symbol, use detergent that also says HE. More detergent doesn't mean cleaner clothes, it leaves residue.", v: "detergent", img: "laundry-5.jpg", alt: "Pouring a capful of detergent into the washer's dispenser drawer" },
        { t: "Pick a setting", d: "Normal and cold works for most clothes. Use hot for towels and sheets if the tag allows.", more: "Cold saves money and keeps colors from fading. Use the delicate setting for thin or stretchy clothes.", v: "dial" },
        { t: "Start it and set a timer", d: "Press start. Move clothes to the dryer soon after it finishes.", more: "Wet clothes left sitting for hours start to smell like mildew. If that happens, wash them again.", v: "timer" },
      ],
      pro: "If the washer won't drain, leaks, or shakes hard, stop it and tell your landlord or laundry room manager.",
      related: ["labels", "dryer"],
    },
    labels: {
      n: "Read a clothing care label", mod: "home", cat: "Laundry", time: "1 minute", level: 1,
      tools: [],
      steps: [
        { t: "Find the tag", d: "It's usually inside the back collar or along the side seam.", v: "label", img: "labels-1.jpg", alt: "Tags sewn inside the back collar of a striped shirt" },
        { t: "The tub means washing", d: "Dots inside show the temperature: one dot cold, two warm, three hot. A hand means hand wash.", more: "An X through any symbol means don't do it.", v: "symWash" },
        { t: "The triangle means bleach", d: "An empty triangle means any bleach is fine. Lines inside mean only non-chlorine bleach.", v: "symBleach" },
        { t: "The square means drying", d: "A circle inside means the dryer is fine. Dots show the heat level.", more: "A square with a line inside means hang it or lay it flat to dry instead.", v: "symDry" },
        { t: "The iron means ironing", d: "Dots show how hot the iron can be: one dot low, three dots high.", v: "symIron" },
        { t: "A circle alone means dry clean", d: "Take it to a dry cleaner. Don't put it in the washer.", v: "symClean" },
      ],
      related: ["laundry", "dryer"],
    },
    dryer: {
      n: "Use a dryer safely", mod: "home", cat: "Laundry", time: "2 minutes of your time", level: 1,
      tools: [],
      steps: [
        { t: "Clean the lint screen", d: "Pull it out, wipe the lint off with your fingers, and slide it back in. Every load.", more: "Built-up lint is a leading cause of dryer fires, and it makes clothes take longer to dry.", v: "lint" },
        { t: "Check for no-dryer items", d: "Leave out anything with a line-dry tag, rubber-backed rugs, and clothes with oil or gas stains.", v: "label" },
        { t: "Don't overfill", d: "Fill it about halfway. Clothes need room to tumble.", v: "load", img: "dryer-3.jpg", alt: "Clothes tumbling inside a dryer" },
        { t: "Pick the heat", d: "Low heat for workout clothes and anything stretchy. Normal or high for towels and jeans.", v: "dial" },
        { t: "Take clothes out right away", d: "Fold or hang them while they're warm to cut down on wrinkles.", v: "timer", img: "dryer-5.jpg", alt: "A hand pulling clean clothes out of the drum" },
      ],
      pro: "If clothes still come out damp after a full cycle, the vent may be clogged. Tell your landlord, since a blocked vent is a fire risk.",
      related: ["laundry", "labels"],
    },
    toilet: {
      n: "Unclog a toilet", mod: "home", cat: "Bathroom", time: "5 to 15 minutes", level: 2,
      tools: ["Flange plunger (the kind with a rubber flap on the bottom)", "Old towels"],
      safety: "Don't pour drain cleaner into a toilet you're about to plunge. It can splash back on you.",
      steps: [
        { t: "Don't flush again", d: "Another flush can make it overflow.", v: "noFlush" },
        { t: "If water is rising, stop it", d: "Turn the valve behind the toilet clockwise until it stops.", more: "Or lift the tank lid and push the rubber flap at the bottom down to stop more water coming in.", v: "valve" },
        { t: "Put towels down", d: "Cover the floor around the toilet in case it splashes.", v: "towels" },
        { t: "Seal the plunger", d: "Put the plunger in so the flap fits into the hole and the cup is covered by water.", v: "plunger" },
        { t: "Push gently, then hard", d: "First push slow to get the air out. Then push and pull hard 15 to 20 times without breaking the seal.", v: "plunge" },
        { t: "Test with one flush", d: "If the water drains, flush once to check. If not, plunge again.", v: "check" },
      ],
      pro: "Still clogged after a few tries, or it clogs often? Tell your landlord or call a plumber.",
      related: ["shutoff"],
    },
    breaker: {
      n: "Power out in one room: reset a breaker", mod: "home", cat: "Electrical", time: "5 minutes", level: 2,
      tools: ["Flashlight"],
      safety: "Never touch the breaker panel with wet hands or while standing in water.",
      steps: [
        { t: "Unplug what was running", d: "Turn off or unplug things in that room, like a space heater or hair dryer.", more: "Too many things on one circuit is the usual reason a breaker trips.", v: "unplug" },
        { t: "Find the breaker panel", d: "Look in the basement, garage, a hallway closet, or near the kitchen.", more: "In an apartment it's often a small gray box inside your unit.", v: "panel" },
        { t: "Find the tripped switch", d: "It's stuck in the middle or flipped the other way from the rest.", v: "breaker" },
        { t: "Push it off, then on", d: "Push it firmly all the way to OFF, then back to ON.", v: "breaker" },
        { t: "Bathroom or kitchen outlet?", d: "Look for an outlet with TEST and RESET buttons nearby and press RESET.", more: "One of these outlets can control others in the same room.", v: "gfci" },
      ],
      pro: "If it trips again right away, leave it off and call your landlord or an electrician. That can mean a wiring problem.",
      related: ["outage"],
    },
    smoke: {
      n: "Smoke alarm chirping: change the battery", mod: "home", cat: "Safety", time: "5 minutes", level: 1,
      tools: ["New battery (check the type on the alarm)", "A sturdy step stool"],
      safety: "If the alarm is sounding fully, not just chirping, get out and call 911.",
      steps: [
        { t: "Find the chirping alarm", d: "A short chirp every 30 to 60 seconds means the battery is low.", v: "smoke" },
        { t: "Twist it off", d: "Turn the alarm counterclockwise to take it off its base.", more: "Some alarms plug into a wire. You can unplug that connector to take it down.", v: "twist" },
        { t: "Swap the battery", d: "Open the battery door and put in a new one, matching the + and - marks.", more: "If there's no battery door, it has a sealed 10-year battery. Replace the whole alarm.", v: "battery" },
        { t: "Put it back and test it", d: "Twist it back on and hold the test button until it beeps loudly.", v: "testBtn" },
        { t: "Check the date", d: "Look at the back. Smoke alarms should be replaced every 10 years.", v: "check" },
      ],
      pro: "Renting? Your landlord is usually responsible for smoke alarms. Let them know if one is broken or old.",
      related: ["breaker"],
    },
    disposal: {
      n: "Garbage disposal hums but won't spin", mod: "home", cat: "Kitchen", time: "10 minutes", level: 2,
      tools: ["1/4 inch Allen wrench (often taped to the disposal)", "Tongs or pliers", "Flashlight"],
      safety: "Never put your hand in the disposal, even with the power off.",
      steps: [
        { t: "Turn it off", d: "Flip the disposal switch off and unplug it under the sink if you can.", v: "unplug" },
        { t: "Find the hole underneath", d: "Look at the very bottom center of the disposal under the sink.", v: "disposal" },
        { t: "Work it loose", d: "Put the Allen wrench in that hole and turn it back and forth until it moves freely.", v: "wrench" },
        { t: "Pull out what's stuck", d: "Shine a light in the drain and remove anything stuck with tongs.", v: "tongs" },
        { t: "Press the reset button", d: "Wait a few minutes, then press the small red button on the bottom.", v: "reset" },
        { t: "Test with cold water", d: "Plug it back in, run cold water, and turn it on.", v: "check" },
      ],
      pro: "Still humming or leaking? Turn it off and tell your landlord or call a plumber.",
      related: ["shutoff"],
    },
    shutoff: {
      n: "Water leak: turn off the water", mod: "home", cat: "Plumbing", time: "2 minutes", level: 2,
      tools: ["Flashlight", "Towels and a bucket"],
      safety: "If water is near outlets or cords, don't walk through it. Stay out until the power is off.",
      steps: [
        { t: "Try the nearby valve first", d: "Most toilets and sinks have their own valve underneath. Turn it clockwise.", more: "Remember: righty tighty. Clockwise closes it.", v: "valve" },
        { t: "Find the main shutoff", d: "Look where the water pipe comes in: the basement, a utility closet, or near the water heater.", more: "Find this before you need it. In some apartments only the building manager can reach it.", v: "main" },
        { t: "Close it", d: "A round handle turns clockwise until it stops. A lever turns a quarter turn so it crosses the pipe.", v: "lever" },
        { t: "Drain the pipes", d: "Open the lowest faucet in your place to let the leftover water out.", v: "faucet" },
        { t: "Call for help and take photos", d: "Call your landlord or a plumber. Take photos of the damage for insurance.", more: "Dry wet areas within a day or two to stop mold from growing.", v: "phone" },
      ],
      pro: "Any leak inside a wall or ceiling needs a plumber. Renters should call the landlord first.",
      related: ["toilet", "disposal"],
    },
    cleaning: {
      n: "A weekly cleaning routine", mod: "home", cat: "Cleaning", time: "About 1 hour a week", level: 1,
      tools: ["All-purpose cleaner", "Toilet brush", "Sponge", "Trash bags"],
      safety: "Never mix bleach with ammonia or other cleaners. It makes toxic fumes.",
      steps: [
        { t: "Kitchen", d: "Wash dishes, wipe counters and the stove, and toss old food from the fridge.", v: "kitchen" },
        { t: "Bathroom", d: "Scrub the toilet, wipe the sink and mirror, and clean the shower.", v: "bathroom" },
        { t: "Trash and recycling", d: "Take it out before it smells. Learn your pickup day.", v: "trash" },
        { t: "Floors", d: "Sweep or vacuum, then mop the kitchen and bathroom.", v: "floor" },
        { t: "Sheets and towels", d: "Wash sheets every one to two weeks and towels every few uses.", v: "load" },
      ],
      related: ["laundry"],
    },
    outage: {
      n: "The power is out everywhere", mod: "home", cat: "Electrical", time: "Until it's back", level: 1, urgent: true,
      tools: ["Flashlight", "Phone charger or power bank"],
      safety: "Never run a grill, camp stove, or generator inside. It can fill the room with carbon monoxide.",
      steps: [
        { t: "Check if it's just you", d: "Look outside or ask a neighbor. If only your place is out, reset the breaker.", v: "breaker" },
        { t: "Report it", d: "Report the outage to your electric company online or by phone.", v: "phone" },
        { t: "Keep the fridge closed", d: "A closed fridge stays cold about 4 hours. A full freezer lasts about 2 days.", v: "fridge" },
        { t: "Unplug electronics", d: "Unplug TVs and computers so a power surge doesn't hurt them when it comes back.", v: "unplug" },
        { t: "Use flashlights, not candles", d: "Candles are a fire risk, especially if you fall asleep.", v: "flashlight" },
      ],
      related: ["breaker"],
    },
    gas: {
      n: "I smell gas", mod: "home", cat: "Emergency", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Gas smells like rotten eggs. Leave first, call second.",
      steps: [
        { t: "Leave right away", d: "Get everyone out, including pets. Leave the door open behind you.", v: "exit" },
        { t: "Don't make a spark", d: "Don't flip light switches, use a lighter, or start a car in the garage.", v: "noSpark" },
        { t: "Call from outside", d: "Once you're far away, call 911 or your gas company's emergency line.", v: "phone" },
        { t: "Wait for the all clear", d: "Don't go back in until the fire department or gas company says it's safe.", v: "check" },
      ],
      related: [],
    },
    lockout: {
      n: "Locked out", mod: "home", cat: "Emergency", time: "Varies", level: 1, urgent: true,
      tools: [],
      safety: "If a child, pet, or something on the stove is inside, call 911.",
      steps: [
        { t: "Check other doors", d: "Try a back door or a ground-floor window you can open safely. Don't climb.", v: "exit" },
        { t: "Call your landlord or roommate", d: "Many landlords have a lockout policy. There may be a fee.", v: "phone" },
        { t: "Call a locksmith", d: "Get the full price on the phone first, and ask for ID when they arrive.", more: "Some locksmith ads quote a low price and charge much more once they're there.", v: "lock" },
        { t: "Make a plan for next time", d: "Give a spare key to someone you trust nearby.", v: "check" },
      ],
      related: [],
    },

    /* ---------- Money ---------- */
    paycheck: {
      n: "Read your paycheck", mod: "money", cat: "Paychecks", time: "5 minutes", level: 1,
      tools: ["Your pay stub (paper or in your work app)"],
      steps: [
        { t: "Find your gross pay", d: "Gross pay is everything you earned before anything comes out: your hours times your pay rate.", v: "stubGross" },
        { t: "Find the income taxes", d: "Federal and state income tax come out based on the W-4 form you filled out when you were hired.", more: "A few states, like New Hampshire and Florida, have no state income tax on wages.", v: "stubTax" },
        { t: "Social Security and Medicare", d: "Almost every paycheck has 6.2% taken for Social Security and 1.45% for Medicare.", more: "On a stub they might say FICA, OASDI, SS, or MED.", v: "stubTax" },
        { t: "Other deductions", d: "Health insurance, retirement savings like a 401(k), and other benefits you signed up for.", v: "stubTax" },
        { t: "Net pay is what you get", d: "Net pay, or take-home pay, is what lands in your bank account. Budget with this number.", v: "stubNet" },
        { t: "Check it every time", d: "Make sure your hours and pay rate are right. Mistakes happen.", more: "Found one? Tell your manager or payroll right away. Keep your stubs for at least a year.", v: "check" },
      ],
      pro: "Take-home pay way off from what you expected? Ask payroll to check your W-4, or you could owe money at tax time.",
      related: ["budget"],
    },
    budget: {
      n: "Build a starter budget", mod: "money", cat: "Budgeting", time: "20 minutes", level: 1,
      tools: ["Your last few pay stubs", "Your bills"],
      steps: [
        { t: "Add up your monthly take-home", d: "Paid weekly? Multiply one paycheck by 52, then divide by 12.", more: "Every two weeks? Multiply by 26, then divide by 12.", v: "stubNet" },
        { t: "List your must-pays", d: "Rent, utilities, phone, insurance, car payment, minimum debt payments, and groceries.", v: "listDoc" },
        { t: "Try the 50/30/20 split", d: "About 50% on needs, 30% on wants, and 20% on savings and paying down debt.", more: "It's a starting point. If rent is high, cut wants first. The budget calculator in Money does the math for you.", v: "pie" },
        { t: "Pay yourself first", d: "Set an automatic transfer to savings on payday, before you can spend it.", v: "transfer" },
        { t: "Build an emergency fund", d: "Start with $500 to $1,000, then work up to 3 months of must-pays.", v: "jar" },
        { t: "Check in every month", d: "Compare what you planned with what you spent, then adjust.", v: "calendar" },
      ],
      related: ["paycheck", "overdraft"],
    },
    credit: {
      n: "How credit scores work", mod: "money", cat: "Credit", time: "5 minutes", level: 1,
      tools: [],
      steps: [
        { t: "What a credit score is", d: "A number from 300 to 850 that shows lenders how likely you are to pay back money. Higher is better.", v: "creditGauge" },
        { t: "Pay on time, every time", d: "Payment history is the biggest part of your score. One late payment can hurt for years.", more: "Set up autopay for at least the minimum on every card and loan.", v: "calendar" },
        { t: "Keep balances low", d: "Try to use less than 30% of your credit limit. Lower is even better.", more: "With a $1,000 limit, keep the balance under $300.", v: "card" },
        { t: "Keep old accounts open", d: "A longer history helps. Don't close your oldest card just because you stopped using it.", v: "card" },
        { t: "Check your reports for free", d: "Get free reports from all three credit bureaus at AnnualCreditReport.com.", more: "Dispute anything that's wrong. Never pay a company that promises to fix your credit.", v: "report" },
        { t: "Starting from zero?", d: "A secured credit card or being an authorized user on a family member's card can help you start.", v: "card" },
      ],
      related: ["budget"],
    },
    overdraft: {
      n: "Stop overdraft and bank fees", mod: "money", cat: "Banking", time: "10 minutes", level: 1,
      tools: ["Your bank app"],
      steps: [
        { t: "Know your real balance", d: "Check before you spend. Pending charges may not show yet.", v: "phoneBank" },
        { t: "Turn on low-balance alerts", d: "Set your bank app to text you when your balance drops below an amount you pick.", v: "phoneBank" },
        { t: "Say no to overdraft coverage", d: "Banks need your OK to charge overdraft fees on debit card buys. Without it, the card is just declined.", more: "Call your bank or check your app's settings to opt out.", v: "card" },
        { t: "Link your savings", d: "Overdraft protection from your own savings often costs less, or nothing.", v: "transfer" },
        { t: "Look for no-fee accounts", d: "Many banks and credit unions offer checking with no monthly fee and no overdraft fees.", v: "bank" },
        { t: "Got charged? Ask", d: "Call and politely ask them to waive the fee, especially if it's your first. It often works.", v: "phone" },
      ],
      related: ["budget"],
    },

    /* ---------- Living on your own ---------- */
    lease: {
      n: "Before you sign a lease", mod: "living", cat: "Renting", time: "30 minutes", level: 2,
      tools: ["The lease", "Your phone camera"],
      steps: [
        { t: "Read every page", d: "Find the rent, due date, late fee, lease length, and how much notice you must give to move out.", v: "leaseDoc" },
        { t: "Ask what's included", d: "Which utilities, parking, laundry, and trash pickup will you pay for?", v: "utilities" },
        { t: "Check the place over", d: "Run faucets, flush toilets, test outlets and locks, and look for leaks, mold, or pests.", v: "faucet" },
        { t: "Know the move-in costs", d: "First month's rent, security deposit, and any fees. Get every amount in writing.", more: "Rules vary by state. In Massachusetts, a landlord can charge at most first and last month's rent, a security deposit up to one month's rent, and the cost of a new lock.", v: "cash" },
        { t: "Get promises in writing", d: "If the landlord promises new paint or a fixed oven, add it to the lease before you sign.", v: "pen" },
        { t: "Keep a copy", d: "Save a signed copy and a photo of every page on your phone.", v: "camera" },
      ],
      pro: "Lease seem unfair or confusing? Local legal aid or a tenant rights group can look it over for free or cheap.",
      related: ["deposit", "utilities"],
    },
    deposit: {
      n: "Get your security deposit back", mod: "living", cat: "Renting", time: "Move-in and move-out", level: 1,
      tools: ["Your phone camera"],
      steps: [
        { t: "Photograph everything on move-in", d: "Photos and video of every room, wall, floor, and appliance before you unpack.", v: "camera" },
        { t: "Send a damage list", d: "Email your landlord a list of anything already damaged, with photos, in the first week.", more: "Some states, including Massachusetts, require the landlord to give you a written condition statement. Check it, sign it, and keep a copy.", v: "email" },
        { t: "Report problems in writing", d: "Tell your landlord about leaks or broken things right away, so they aren't blamed on you.", v: "email" },
        { t: "Clean before you leave", d: "Clean every room, take out all trash, and patch small nail holes if your lease allows it.", v: "floor" },
        { t: "Do a final walkthrough", d: "Walk through with your landlord if you can, and take new photos of every room.", v: "camera" },
        { t: "Give your new address", d: "Send it in writing so the deposit can reach you. States set a deadline to return it.", more: "In Massachusetts it's 30 days after you move out.", v: "email" },
      ],
      related: ["lease"],
    },
    utilities: {
      n: "Set up utilities and internet", mod: "living", cat: "Moving in", time: "1 hour", level: 1,
      tools: ["Your lease", "Your ID"],
      steps: [
        { t: "Ask what's in your name", d: "Ask the landlord which you set up: electric, gas, water, trash, and internet.", v: "utilities" },
        { t: "Call 1 to 2 weeks ahead", d: "Schedule service to start on move-in day so you aren't in the dark.", v: "calendar" },
        { t: "Have your info ready", d: "Your new address, move-in date, and ID. Some ask for a deposit if you have no credit history.", v: "idCard" },
        { t: "Compare internet plans", d: "See which companies serve your address. Ask what the price is after the first year.", v: "wifi" },
        { t: "Photo the meters on day one", d: "Take a photo of the electric and gas meter readings so you only pay for what you use.", v: "meter" },
        { t: "Set up autopay", d: "Autopay or reminders keep anything from getting shut off by accident.", v: "calendar" },
      ],
      related: ["lease", "roommate"],
    },
    roommate: {
      n: "Make a roommate agreement", mod: "living", cat: "Roommates", time: "30 minutes", level: 1,
      tools: [],
      steps: [
        { t: "Talk early", d: "Sit down in the first week, before small things turn into fights.", v: "talk" },
        { t: "Split the bills", d: "Decide who pays what and when. A bill-splitting app keeps it tracked.", v: "pie" },
        { t: "Make a chore chart", d: "Dishes, trash, bathroom, and shared spaces. Rotate them weekly.", v: "listDoc" },
        { t: "Agree on guests and quiet hours", d: "How often can friends or partners stay over? When does it get quiet?", v: "timer" },
        { t: "Decide what's shared", d: "Food, cleaning supplies, and dishes: what's shared and what's yours?", v: "fridge" },
        { t: "Write it down", d: "Put it in a shared note, both agree to it, and check in after a month.", v: "pen" },
      ],
      related: ["utilities"],
    },

    /* ---------- Food ---------- */
    groceries: {
      n: "Grocery shopping on a budget", mod: "food", cat: "Shopping", time: "About 1 hour a week", level: 1,
      tools: ["Your shopping list"],
      steps: [
        { t: "Plan your meals first", d: "Pick the week's meals, then shop for just those.", v: "listDoc" },
        { t: "Check what you have", d: "Look in the fridge and cupboards so you don't buy doubles.", v: "fridge" },
        { t: "Make a list and stick to it", d: "Shopping without a list leads to extra buys you didn't need.", v: "listDoc" },
        { t: "Compare unit prices", d: "The small shelf tag shows the price per ounce or pound. That's the real deal.", v: "unitPrice" },
        { t: "Try store brands", d: "Store brands often cost much less for nearly the same thing.", v: "cart" },
        { t: "Don't shop hungry", d: "Eat first. Hungry shoppers spend more.", v: "check" },
      ],
      related: ["leftovers", "sheetpan"],
    },
    meatsafety: {
      n: "Cook meat safely", mod: "food", cat: "Food safety", time: "2 minutes", level: 2,
      tools: ["Food thermometer"],
      steps: [
        { t: "Wash your hands", d: "20 seconds with soap before and after touching raw meat.", v: "faucet" },
        { t: "Keep raw meat separate", d: "Use a different cutting board and plate for raw meat.", v: "boards" },
        { t: "Use a thermometer", d: "Color isn't a safe test. Push it into the thickest part of the meat.", v: "therm165" },
        { t: "Chicken and turkey: 165°F", d: "All poultry, including ground turkey, is done at 165°F.", v: "therm165" },
        { t: "Ground beef and pork: 160°F", d: "Burgers and other ground meat are done at 160°F.", v: "therm160" },
        { t: "Steaks and chops: 145°F", d: "Whole cuts of beef and pork are safe at 145°F, then let them rest 3 minutes.", v: "therm145" },
      ],
      related: ["leftovers", "sheetpan"],
    },
    leftovers: {
      n: "How long leftovers last", mod: "food", cat: "Food safety", time: "1 minute", level: 1,
      tools: [],
      steps: [
        { t: "Refrigerate within 2 hours", d: "Within 1 hour if it's over 90°F. Keep your fridge at 40°F or colder.", v: "fridge" },
        { t: "Use shallow containers", d: "Food cools faster in shallow containers, before bacteria can grow.", v: "container" },
        { t: "Eat within 3 to 4 days", d: "Most leftovers are safe in the fridge for 3 to 4 days. Write the date on them.", v: "container" },
        { t: "Freeze for later", d: "Frozen food stays safe, and tastes best if eaten within 3 to 4 months.", v: "freezer" },
        { t: "Reheat to 165°F", d: "Heat leftovers until they're steaming hot all the way through.", v: "therm165" },
        { t: "When in doubt, throw it out", d: "You can't always see or smell the bacteria that make you sick.", v: "trash" },
      ],
      related: ["meatsafety"],
    },
    sheetpan: {
      n: "Sheet-pan chicken and vegetables", mod: "food", cat: "One-pan meals", time: "40 minutes", level: 1,
      tools: ["Sheet pan", "Food thermometer"],
      recipe: { serves: 2, cost: "About $8 to $10", items: [["Chicken thighs", "1 lb"], ["Potatoes", "2 medium"], ["Broccoli", "1 bag (12 oz)"], ["Olive oil", "2 tbsp"], ["Garlic powder", "1 tsp"], ["Salt and pepper", "To taste"]] },
      steps: [
        { t: "Heat the oven to 425°F", d: "Let it heat while you chop.", v: "oven" },
        { t: "Chop the vegetables", d: "Cut potatoes into bite-size pieces and broccoli into small trees.", v: "knife" },
        { t: "Season everything", d: "Toss the chicken and vegetables with oil, garlic powder, salt, and pepper.", v: "bowl" },
        { t: "Spread it out", d: "One layer on the pan, not piled up, so it browns instead of steams.", v: "sheetPan" },
        { t: "Roast 25 to 30 minutes", d: "Until the potatoes are browned and the chicken reads 165°F.", v: "therm165" },
        { t: "Save the extras", d: "Put leftovers in shallow containers in the fridge. Eat within 3 to 4 days.", v: "container" },
      ],
      related: ["meatsafety", "leftovers"],
    },
    pasta: {
      n: "One-pot pasta", mod: "food", cat: "One-pan meals", time: "25 minutes", level: 1,
      tools: ["A big pot"],
      recipe: { serves: 3, cost: "About $5 to $7", items: [["Spaghetti", "8 oz"], ["Diced tomatoes", "1 can (14.5 oz)"], ["Onion", "1"], ["Garlic", "2 cloves"], ["Olive oil", "2 tbsp"], ["Water", "3 cups"], ["Parmesan cheese", "For topping"], ["Salt and pepper", "To taste"]] },
      steps: [
        { t: "Put it all in the pot", d: "Pasta, tomatoes, sliced onion and garlic, oil, salt, and the water.", v: "pot" },
        { t: "Bring it to a boil", d: "On high heat. Stay close so it doesn't boil over.", v: "pot" },
        { t: "Stir often", d: "Boil 9 to 11 minutes, stirring every minute or two so nothing sticks.", v: "pot" },
        { t: "Check the pasta", d: "Taste a piece. It's done when it's soft with a little bite and most of the water is gone.", v: "pot" },
        { t: "Top it and serve", d: "Add cheese and pepper.", v: "bowl" },
      ],
      related: ["groceries"],
    },
    eggs: {
      n: "Scrambled eggs", mod: "food", cat: "One-pan meals", time: "10 minutes", level: 1,
      tools: ["Nonstick pan", "Spatula"],
      recipe: { serves: 1, cost: "About $1 to $2", items: [["Eggs", "3"], ["Butter", "1 tbsp"], ["Salt and pepper", "A pinch"]] },
      steps: [
        { t: "Crack and whisk", d: "Crack the eggs into a bowl, add a pinch of salt, and whisk until no streaks are left.", v: "bowl" },
        { t: "Melt the butter", d: "Medium-low heat. Low and slow keeps eggs soft.", v: "pan" },
        { t: "Pour in the eggs", d: "Let them sit a few seconds until the edges start to set.", v: "pan" },
        { t: "Push and fold", d: "Slowly push the eggs across the pan with a spatula to make soft curds.", v: "pan" },
        { t: "Take them off a little early", d: "Pull the pan off when they still look a bit wet. They keep cooking.", v: "check" },
      ],
      related: ["groceries"],
    },

    /* ---------- Health and admin ---------- */
    doctor: {
      n: "Find a doctor and book a visit", mod: "health", cat: "Doctors", time: "20 minutes", level: 1,
      tools: ["Your insurance card", "Your ID"],
      steps: [
        { t: "Check your insurance first", d: "Use your insurance app or call the number on your card to find doctors in your network.", v: "insCard" },
        { t: "Pick a primary care doctor", d: "A primary care provider handles checkups and sends you to specialists when needed.", v: "doctor" },
        { t: "Call or book online", d: "Say you're a new patient and ask for the first open appointment.", more: "New-patient waits can be weeks, so book before you get sick.", v: "phone" },
        { t: "Have your info ready", d: "Insurance card, ID, your medicines, allergies, and past health issues.", v: "idCard" },
        { t: "Write your questions down", d: "Bring a short list so you don't forget anything in the exam room.", v: "listDoc" },
        { t: "Get there early", d: "Arrive 15 minutes early for new-patient paperwork.", v: "timer" },
      ],
      related: ["insurance", "urgentcare"],
    },
    insurance: {
      n: "Health insurance words, explained", mod: "health", cat: "Insurance", time: "5 minutes", level: 1,
      tools: [],
      steps: [
        { t: "Premium", d: "What you pay every month to have insurance, even if you never use it.", more: "You can usually stay on a parent's plan until you turn 26.", v: "insCard" },
        { t: "Deductible", d: "What you pay for care each year before insurance starts paying its share.", v: "cash" },
        { t: "Copay", d: "A set amount, like $25, for a visit or a prescription.", v: "cash" },
        { t: "Coinsurance", d: "After the deductible, you pay a percentage, like 20%, and insurance pays the rest.", v: "pie" },
        { t: "Out-of-pocket max", d: "The most you'll pay for covered care in a year. After that, insurance pays 100%.", v: "check" },
        { t: "In-network", d: "Doctors who work with your plan. Going out of network usually costs a lot more.", v: "doctor" },
      ],
      related: ["doctor", "urgentcare"],
    },
    urgentcare: {
      n: "Urgent care or the ER?", mod: "health", cat: "Getting care", time: "1 minute", level: 2,
      tools: [],
      safety: "Chest pain, trouble breathing, stroke signs, or bad bleeding: call 911.",
      steps: [
        { t: "ER for emergencies", d: "Chest pain, trouble breathing, stroke signs, bad bleeding, or a serious injury.", v: "hospital" },
        { t: "Urgent care for the in-between", d: "Sprains, cuts that may need stitches, flu, ear infections, and rashes.", v: "clinic" },
        { t: "Your doctor for the rest", d: "Checkups, refills, and problems that can wait a day or two.", v: "doctor" },
        { t: "Call the nurse line", d: "Many insurance cards list a free 24/7 nurse line that can tell you where to go.", v: "insCard" },
        { t: "Know the cost difference", d: "The ER usually costs far more than urgent care for the same small problem.", v: "cash" },
        { t: "When in doubt, get help", d: "If it might be serious, don't let cost stop you. Call 911.", v: "phone" },
      ],
      related: ["doctor", "hurtalone"],
    },
    documents: {
      n: "Keep important documents safe", mod: "health", cat: "Paperwork", time: "30 minutes", level: 1,
      tools: ["A folder or fireproof box"],
      steps: [
        { t: "Gather the originals", d: "Birth certificate, Social Security card, passport, car title, and insurance policies.", v: "folder" },
        { t: "Store them safely", d: "Keep originals in a fireproof box or folder at home, not in your wallet.", v: "safeBox" },
        { t: "Carry only what you need", d: "Your ID and insurance card. Leave your Social Security card at home.", v: "idCard" },
        { t: "Make digital copies", d: "Scan or photograph them and save them somewhere password-protected.", v: "camera" },
        { t: "Track expiration dates", d: "Write down when your license, registration, and passport expire, and set reminders.", v: "calendar" },
        { t: "Shred old papers", d: "Shred anything with your Social Security or account numbers before throwing it out.", v: "shred" },
      ],
      related: ["doctor"],
    },

    /* ---------- Car ---------- */
    oil: {
      n: "Check your oil", mod: "car", cat: "Maintenance", time: "5 minutes", level: 1,
      tools: ["Paper towel or rag"],
      steps: [
        { t: "Park on level ground", d: "Turn the engine off and wait 5 to 10 minutes so the oil settles.", more: "Some newer cars have no dipstick and show the oil level on the dashboard. Check your owner's manual.", v: "car" },
        { t: "Open the hood", d: "Pull the hood release inside the car, then find the latch under the front of the hood.", v: "hood" },
        { t: "Find the dipstick", d: "Look for a loop handle, often yellow or orange, sometimes with an oil can symbol.", v: "dipstick" },
        { t: "Pull, wipe, push back in", d: "Pull it out, wipe it clean, then push it all the way back in.", v: "dipstick" },
        { t: "Pull it again and read it", d: "The oil line should be between the two marks. Below the low mark? Add oil.", v: "dipRead" },
        { t: "Add the right oil", d: "Use the type in your owner's manual, like 5W-30. Add a little at a time, then check again.", v: "oilCan" },
      ],
      pro: "Oil looks milky, or you have to add it often? Have a mechanic check it soon.",
      related: ["tires"],
    },
    tires: {
      n: "Check tire pressure", mod: "car", cat: "Maintenance", time: "10 minutes", level: 1,
      tools: ["Tire pressure gauge"],
      steps: [
        { t: "Find the right number", d: "Check the sticker inside the driver's door. Don't use the number printed on the tire.", v: "doorSticker" },
        { t: "Check when tires are cold", d: "Before driving, or after the car has sat for a few hours.", v: "timer" },
        { t: "Take off the valve cap", d: "Twist off the small cap on the tire's valve stem.", v: "tireValve" },
        { t: "Press the gauge on", d: "Push it straight on until the hissing stops, then read the number.", v: "tireGauge" },
        { t: "Add air if it's low", d: "Most gas stations have an air pump. Add a little, then check again.", v: "tireGauge" },
        { t: "Check every month", d: "Cold weather lowers tire pressure, so check more often in winter.", v: "calendar" },
      ],
      related: ["oil"],
    },
    jump: {
      n: "Jump-start a car", mod: "car", cat: "Breakdowns", time: "15 minutes", level: 2,
      tools: ["Jumper cables", "A second car that runs"],
      safety: "Never let the metal clamps touch each other while any clamp is on a battery.",
      steps: [
        { t: "Park nose to nose", d: "Get the working car close. Both cars off, parking brakes on.", v: "twoCars" },
        { t: "Red to the dead battery +", d: "Clamp one red clip to the + terminal on the dead battery.", v: "jumpDeadPos" },
        { t: "Red to the good battery +", d: "Clamp the other red clip to the + terminal on the good battery.", v: "jumpGoodPos" },
        { t: "Black to the good battery −", d: "Clamp one black clip to the − terminal on the good battery.", v: "jumpGoodNeg" },
        { t: "Black to bare metal", d: "Clamp the last black clip to unpainted metal on the dead car's engine, away from the battery.", v: "jumpGround" },
        { t: "Start, then remove", d: "Start the good car, wait a few minutes, then start the dead one. Remove clips in reverse order.", more: "Drive the jumped car for at least 20 minutes so the battery can recharge.", v: "check" },
      ],
      pro: "Won't start after a jump, or dies again soon? The battery or alternator may need replacing.",
      related: ["crash"],
    },
    fenderbender: {
      n: "After a fender bender", mod: "car", cat: "Accidents", time: "30 minutes", level: 2,
      tools: ["Your phone", "Your license, registration, and insurance card"],
      safety: "If anyone is hurt or the cars are blocking traffic in a dangerous spot, call 911 first.",
      steps: [
        { t: "Check for injuries", d: "Is anyone hurt? Call 911.", v: "phone" },
        { t: "Move out of traffic", d: "If the cars can drive and no one is hurt, pull to the side and turn on hazard lights.", v: "car" },
        { t: "Swap information", d: "Names, phone numbers, insurance companies and policy numbers, plates, and car make and model.", v: "idCard" },
        { t: "Take photos", d: "Both cars, the damage, both plates, the scene, and the other driver's insurance card.", v: "camera" },
        { t: "Don't argue about fault", d: "Stay calm and stick to the facts. Let the insurance companies decide.", v: "talk" },
        { t: "Report it", d: "Call your insurance company. File a police report if anyone was hurt or your state requires it.", more: "In Massachusetts, file a crash report within 5 days if anyone was hurt or damage is over $1,000.", v: "phone" },
      ],
      related: ["crash"],
    },

    /* ---------- Murphy's Law: when it goes wrong and you're on your own ---------- */
    kitchenfire: {
      n: "Grease fire on the stove", mod: "ready", group: "crisis", cat: "Fire", time: "Right now", level: 3, urgent: true,
      tools: ["A metal lid or baking sheet", "Fire extinguisher, if you have one"],
      safety: "Never throw water on a grease fire. It makes the fire explode outward.",
      steps: [
        { t: "Turn off the burner", d: "Only if you can reach the knob safely.", v: "stoveOff" },
        { t: "Cover it with a lid", d: "Slide a metal lid or baking sheet over the pan and leave it there.", more: "No air means no fire. Don't lift the lid to check for a while.", v: "lid" },
        { t: "Never use water", d: "Water on burning oil throws the fire everywhere.", v: "noWater" },
        { t: "Don't carry the pan", d: "Moving it spills burning oil on you and the floor.", v: "noCarry" },
        { t: "Still burning? Get out", d: "Leave, close the door behind you, and call 911 from outside.", v: "exit" },
      ],
      pro: "Oven or microwave fire: keep the door shut and turn it off. If it doesn't go out fast, leave and call 911.",
      related: ["housefire"],
    },
    housefire: {
      n: "Fire in your home", mod: "ready", group: "crisis", cat: "Fire", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Get out first. Nothing you own is worth going back for.",
      steps: [
        { t: "Get out now", d: "Yell \"Fire!\" to wake others and leave. Don't stop to grab things.", v: "exit" },
        { t: "Stay low", d: "Smoke rises. Crawl under it where the air is cleaner.", v: "crawl" },
        { t: "Feel doors first", d: "Touch the door with the back of your hand. If it's hot, use another way out.", v: "doorHand" },
        { t: "Close doors behind you", d: "A closed door slows the fire and smoke down.", v: "doorClose" },
        { t: "Call 911 from outside", d: "Never go back in. Tell firefighters if anyone is still inside.", v: "phone" },
      ],
      pro: "Make an escape plan now: know two ways out of every room.",
      related: ["kitchenfire", "coalarm"],
    },
    coalarm: {
      n: "Carbon monoxide alarm going off", mod: "ready", group: "crisis", cat: "Air", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Carbon monoxide has no smell. If the alarm sounds, believe it.",
      steps: [
        { t: "Get outside now", d: "Get everyone and pets out to fresh air. Leave the door open.", v: "exit" },
        { t: "Call 911", d: "Call from outside, especially if anyone has a headache, dizziness, or nausea.", v: "phone" },
        { t: "Stay out", d: "Don't go back in until firefighters or the gas company say it's safe.", v: "check" },
      ],
      pro: "Every home with gas appliances or an attached garage needs a carbon monoxide alarm on each floor.",
      related: ["housefire", "gas"],
    },
    storm: {
      n: "A big storm is coming", mod: "ready", group: "crisis", cat: "Weather", time: "A day ahead", level: 2, urgent: true,
      tools: ["Your home emergency kit"],
      safety: "Follow evacuation orders right away. Roads get crowded and dangerous fast.",
      steps: [
        { t: "Charge everything", d: "Phone, power bank, and laptop. Keep them charged until the storm passes.", v: "battery" },
        { t: "Get water and food", d: "At least 1 gallon of water per person per day for several days, plus food that needs no cooking.", v: "kit" },
        { t: "Fill your gas tank", d: "Gas stations may lose power or run out.", v: "car" },
        { t: "Bring things inside", d: "Patio furniture, grills, and trash cans can become flying debris.", v: "trash" },
        { t: "Know your plan", d: "Look up your evacuation zone and where you'd go. Tell someone your plan.", v: "phone" },
      ],
      related: ["outage"],
    },
    hurtalone: {
      n: "Hurt or sick and home alone", mod: "ready", group: "crisis", cat: "Health", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "If it might be serious, call 911. Don't wait to see if it gets better.",
      steps: [
        { t: "Call 911 if it's serious", d: "Chest pain, trouble breathing, a bad fall, heavy bleeding, or feeling like you'll pass out.", v: "phone" },
        { t: "Unlock the door", d: "If you can, unlock it so help can get in.", v: "lock" },
        { t: "Text someone", d: "Tell a friend or family member what's happening and where you are.", v: "phone" },
        { t: "Set up your medical ID", d: "Add allergies, medicines, and an emergency contact on your phone's lock screen.", more: "Responders check it first. On iPhone it's in the Health app. On Android, look for Emergency information in Settings.", v: "check" },
      ],
      pro: "Not an emergency but not sure? Urgent care or your doctor's nurse line can tell you if you need to come in.",
      related: [],
    },

    /* ---------- Step in: help someone else ---------- */
    choking: {
      n: "Someone is choking", mod: "ready", group: "stepin", cat: "Step in", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "If they can cough hard or talk, let them keep coughing. Step in only if they can't.",
      steps: [
        { t: "Ask \"Are you choking?\"", d: "If they can't talk, cough, or breathe, act now.", v: "askPerson" },
        { t: "Get 911 called", d: "Point at someone and tell them to call 911. If you're alone, call on speaker.", v: "phone" },
        { t: "Give 5 back blows", d: "Lean them forward. Hit hard between the shoulder blades with the heel of your hand.", v: "backBlow" },
        { t: "Give 5 abdominal thrusts", d: "Fist just above the belly button, other hand over it. Pull in and up, hard.", v: "thrust" },
        { t: "Keep switching", d: "5 back blows, then 5 thrusts, until the object comes out.", v: "check" },
        { t: "If they pass out, start CPR", d: "Lower them to the floor and start chest compressions.", v: "cpr" },
      ],
      pro: "Take a CPR and first aid class. The Red Cross and American Heart Association run them near you.",
      related: ["cpr"],
    },
    cpr: {
      n: "Someone collapsed and isn't breathing", mod: "ready", group: "stepin", cat: "Step in", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Hands-only CPR is for adults and teens who collapse and aren't breathing normally.",
      steps: [
        { t: "Check and shout", d: "Make sure the area is safe. Tap their shoulder and shout \"Are you OK?\"", v: "askPerson" },
        { t: "Call 911", d: "Put the phone on speaker. Send someone to find an AED (the defibrillator in public places).", v: "phone" },
        { t: "Push hard and fast", d: "Both hands in the center of the chest. Push 2 inches deep, 100 to 120 times a minute.", more: "That's the beat of the song \"Stayin' Alive.\" Let the chest come all the way back up between pushes.", v: "cpr" },
        { t: "Use the AED", d: "Turn it on and do what it says. It talks you through every step.", v: "aed" },
        { t: "Don't stop", d: "Keep going until help takes over or the person starts breathing.", v: "check" },
      ],
      pro: "A 2-hour CPR class makes you ready to save a life. Search \"CPR class near me\" on the Red Cross or American Heart Association site.",
      related: ["choking"],
    },
    seizure: {
      n: "Someone is having a seizure", mod: "ready", group: "stepin", cat: "Step in", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Never put anything in their mouth, and never hold them down.",
      steps: [
        { t: "Stay calm and time it", d: "Look at the clock when it starts.", v: "timer" },
        { t: "Clear the area", d: "Move hard or sharp things away. Put something soft under their head.", v: "towels" },
        { t: "Turn them on their side", d: "This keeps their airway clear. Loosen anything tight around the neck.", v: "sideLay" },
        { t: "Stay until they're awake", d: "Talk calmly as they come to. They may be confused for a while.", v: "askPerson" },
        { t: "Know when to call 911", d: "Over 5 minutes, another seizure, trouble breathing, hurt, in water, or a first seizure.", v: "phone" },
      ],
      related: ["cpr"],
    },
    bleeding: {
      n: "Someone is bleeding badly", mod: "ready", group: "stepin", cat: "Step in", time: "Right now", level: 3, urgent: true,
      tools: ["Clean cloth or gauze", "Gloves, if you have them"],
      safety: "Call 911 for bleeding that won't stop, spurts, or soaks through cloth fast.",
      steps: [
        { t: "Call 911", d: "Or tell someone nearby to call while you help.", v: "phone" },
        { t: "Press hard", d: "Put a cloth on the wound and press down firmly with both hands.", v: "press" },
        { t: "Don't lift to check", d: "If blood soaks through, add more cloth on top and keep pressing.", v: "press" },
        { t: "Keep pressing until help arrives", d: "Steady pressure is what stops most bleeding.", v: "check" },
      ],
      pro: "A free Stop the Bleed class teaches pressure, wound packing, and tourniquets in about an hour.",
      related: ["cpr"],
    },
    crash: {
      n: "You see a car crash", mod: "ready", group: "stepin", cat: "Step in", time: "Right now", level: 3, urgent: true,
      tools: [],
      safety: "Don't become a second victim. Only stop where it's safe.",
      steps: [
        { t: "Pull over safely", d: "Park well past the crash with your hazard lights on.", v: "car" },
        { t: "Call 911", d: "Give the road, direction, nearest exit or landmark, and how many cars.", v: "phone" },
        { t: "Don't move anyone", d: "Moving someone can hurt their neck or back. Only move them away from fire or traffic.", v: "noCarry" },
        { t: "Talk to them", d: "Ask if they're OK, tell them help is coming, and keep them still.", v: "askPerson" },
        { t: "Help with bleeding", d: "Press on any heavy bleeding with a cloth until help arrives.", v: "press" },
      ],
      related: ["bleeding", "cpr"],
    },
  };

  /* Panic button: urgent guides first, then any related guide */
  const PANIC = ["gas", "housefire", "kitchenfire", "coalarm", "shutoff", "toilet", "outage", "lockout", "smoke"];

  /* Murphy's Law: what can go wrong to you, and when to step in for someone else */
  const READY = {
    crisis: ["housefire", "kitchenfire", "coalarm", "storm", "hurtalone", "outage", "shutoff", "gas", "lockout"],
    stepin: ["cpr", "choking", "bleeding", "seizure", "crash"],
    kits: ["homekit", "carkit", "firstaid", "gobag"],
    classes: [
      { n: "CPR and first aid class", where: "American Red Cross or American Heart Association", url: "https://www.redcross.org/take-a-class" },
      { n: "Stop the Bleed class", where: "Free classes near you", url: "https://www.stopthebleed.org" },
    ],
  };

  const RESOURCES = [
    { n: "Emergency", num: "911", note: "Fire, crime, medical emergency, or anyone in danger" },
    { n: "988 Suicide and Crisis Lifeline", num: "988", note: "Call or text, any time, free and confidential" },
    { n: "Poison Control", num: "1-800-222-1222", note: "Swallowed or touched something harmful" },
    { n: "211", num: "211", note: "Local help with food, housing, bills, and more" },
    { n: "National Domestic Violence Hotline", num: "1-800-799-7233", note: "Free and confidential, any time" },
  ];

  /* Where you stand: how the user compares with people their age. Real data only, with its source.
     Living with parents counts college dorms as living at home, the way the Census does. */
  const BENCHMARKS = {
    home: {
      n: "Live with their parents", source: "U.S. Census Bureau, Current Population Survey, 2023 (via Bowling Green State University NCFMR)",
      byAge: [[18, 24, 57.1], [25, 29, 21.7], [30, 34, 12.1]],
    },
    license: {
      n: "Have a driver's license", source: "Federal Highway Administration, Highway Statistics 2024, table DL-20",
      byAge: [[16, 16, 26.2], [17, 17, 44.4], [18, 18, 60.4], [19, 19, 68.8], [20, 24, 80.9], [25, 29, 89.3], [30, 34, 89.7]],
    },
  };
  const benchmark = (key, age) => { const b = BENCHMARKS[key]; const r = b && b.byAge.find(([lo, hi]) => age >= lo && age <= hi); return r ? { pct: r[2], range: r[0] === r[1] ? `${r[0]}` : `${r[0]} to ${r[1]}` } : null; };

  /* Life-moment checklist */
  const CHECKLISTS = {
    apartment: {
      n: "First apartment",
      groups: [
        ["Before you sign", ["Read the whole lease, including fees and move-out rules", "Ask what utilities are included", "Walk through and test faucets, outlets, and locks", "Know your rent due date and late fee"]],
        ["Move-in day", ["Photograph every room before you unpack", "Find the breaker panel and water shutoff", "Test the smoke and carbon monoxide alarms", "Write down any damage and send it to your landlord"]],
        ["First week", ["Set up electric, internet, and gas in your name", "Get renters insurance", "Change your address with the post office", "Learn your trash and recycling days"]],
        ["First month", ["Set up autopay or a reminder for rent", "Make a simple budget", "Save your landlord's and maintenance contacts", "Put together a basic toolkit and first aid kit"]],
      ],
    },
    homekit: {
      n: "Home emergency kit", kit: true, blurb: "Enough to get by for 3 days with no power or water",
      groups: [
        ["Water and food", ["Water: 1 gallon per person per day, for at least 3 days", "Food that needs no cooking for 3 days", "Manual can opener"]],
        ["Light and power", ["Flashlight", "Extra batteries", "Power bank, charged", "Battery or hand-crank radio"]],
        ["Safety", ["Smoke alarms tested this month", "Carbon monoxide alarm", "Fire extinguisher (know where it is)", "Whistle to signal for help"]],
        ["Personal", ["A week of any medicines you take", "Copies of ID and insurance cards", "Some cash in small bills", "Phone numbers written on paper"]],
      ],
    },
    carkit: {
      n: "Car emergency kit", kit: true, blurb: "For breakdowns, flat tires, and getting stuck",
      groups: [
        ["Car trouble", ["Jumper cables", "Tire pressure gauge", "Spare tire, checked", "Reflective triangles or flares"]],
        ["Getting stuck", ["Water and snacks", "Blanket", "Phone charger for the car", "Flashlight"]],
        ["Winter", ["Ice scraper and brush", "Small shovel", "Sand or kitty litter for traction"]],
      ],
    },
    firstaid: {
      n: "First aid kit", kit: true, blurb: "For cuts, burns, and sprains at home",
      groups: [
        ["Wounds", ["Bandages in different sizes", "Gauze pads and tape", "Antiseptic wipes", "Disposable gloves"]],
        ["Other", ["Pain reliever", "Tweezers", "Instant cold pack", "Emergency blanket", "Thermometer"]],
      ],
    },
    gobag: {
      n: "Go-bag", kit: true, blurb: "Grab it and leave in 5 minutes if you have to evacuate",
      groups: [
        ["Essentials", ["Water and snacks", "Phone charger and power bank", "A few days of medicines", "Copies of ID and important papers"]],
        ["Comfort", ["Change of clothes", "Toothbrush and basic toiletries", "Flashlight", "Cash"]],
      ],
    },
  };

  /* One tip a day on Home, same for everyone that day */
  const TIPS = [
    "Clean the dryer lint screen every load. It's free and it prevents fires.",
    "Find your water shutoff valve today, before you ever need it.",
    "Cold water gets most clothes clean and keeps colors from fading.",
    "Test your smoke alarm once a month. Hold the button until it beeps.",
    "Take photos of your apartment on move-in day. They protect your deposit.",
    "A full fridge and freezer stay cold longer in a power outage.",
    "Never mix bleach with other cleaners.",
    "Wet laundry left sitting starts to smell in a few hours. Set a timer.",
    "Write your landlord's maintenance number in your phone now.",
    "Renters insurance often costs less than a pizza a month.",
    "Murphy's Law: anything that can go wrong will go wrong. Check your home emergency kit this week.",
    "Know two ways out of every room in your home.",
    "A 2-hour CPR class could let you save someone's life.",
    "Never throw water on a grease fire. Cover it with a lid.",
    "Add an emergency contact to your phone's lock screen today.",
    "Check the unit price on the shelf tag. That's the real deal.",
    "Pay on time every time. It's the biggest part of your credit score.",
    "Check your tire pressure once a month, and more in winter.",
    "Leftovers are good for 3 to 4 days in the fridge.",
    "Book a doctor's checkup before you get sick. New-patient waits can be long.",
  ];
  const dayIndex = (ymd, n) => { const [y, m, d] = String(ymd).split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5) % n; };

  return { CONFIG, TIERS, ONE_TIME, TOPUPS, MODULES, GUIDES, PANIC, READY, BENCHMARKS, benchmark, RESOURCES, CHECKLISTS, TIPS, dayIndex };
});
