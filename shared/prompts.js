// What Adulted asks Claude, and how the answers are checked.
// Shared by the app (browser) and the server (Node). The server builds prompts from these,
// so the public API can only be used for Adulted tasks, never as an open chatbot.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./data"));
  else Object.assign(root, factory(root));
})(typeof self !== "undefined" ? self : this, function (D) {
  const { GUIDES } = D;
  const str = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);

  class BadInput extends Error { constructor(msg) { super(msg || "bad_input"); this.code = "bad_input"; } }

  // Reads JSON from a reply: the whole reply, a code fence, or the first { or [ to the last } or ].
  function parseJson(text) {
    const t = String(text || "").trim();
    const tries = [t];
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) tries.push(fence[1]);
    const a = t.search(/[{[]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (a >= 0 && b > a) tries.push(t.slice(a, b + 1));
    for (const x of tries) { try { return JSON.parse(x); } catch (e) { /* try the next form */ } }
    const err = new Error("invalid_json"); err.code = "invalid_json"; throw err;
  }

  // Words that mean someone may be in crisis. The app shows crisis help right away when it sees them,
  // before and alongside the AI answer.
  const CRISIS_RE = /\b(suicid\w*|kill (my ?self|me)|end (it all|my life)|want to die|wanna die|self[- ]?harm|hurt(ing)? myself|cut(ting)? myself|overdos\w*)\b/i;
  const isCrisis = (text) => CRISIS_RE.test(String(text || ""));

  const PROFILE_KEYS = { state: 40, living: 30, stage: 40, car: 60 };
  const guideList = Object.keys(GUIDES).map((id) => `${id}: ${GUIDES[id].n}`).join("; ");

  const TASKS = {
    // Ask Anything: one practical question about living on your own.
    ask: {
      json: true, tier: "main",
      input(p) {
        const q = str(p && p.q, 600);
        if (q.length < 3) throw new BadInput();
        const prof = {};
        const raw = (p && typeof p.profile === "object" && p.profile) || {};
        for (const k of Object.keys(PROFILE_KEYS)) { const v = str(raw[k], PROFILE_KEYS[k]); if (v) prof[k] = v; }
        return { q, profile: prof };
      },
      prompt({ q, profile }) {
        const about = Object.keys(profile).length
          ? `About the person (use it only if it changes the answer): ${Object.entries(profile).map(([k, v]) => `${k}: ${v}`).join("; ")}.`
          : "Nothing is known about the person.";
        return `A young adult living on their own asked: "${q}"
${about}

Answer with only one JSON object in this shape:
{"title": a short title for the answer (under 60 characters),
 "summary": one plain sentence that answers the question directly,
 "steps": 0 to 8 steps in order if the answer is something to do, each {"t": short step title, "d": one plain sentence},
 "safety": one sentence of safety warning if any step has real risk, otherwise "",
 "pro": one sentence on when to call a landlord, professional, or doctor instead, otherwise "",
 "urgent": true only if this could be an emergency right now,
 "guides": up to 2 matching ids from this list, or []: ${guideList}}

Rules: plain words a 16-year-old understands, short sentences, no jargon. U.S. context. Be accurate and say when rules vary by state. Never give dangerous instructions (gas lines, electrical panels beyond resetting a breaker, anything illegal). For medical, legal, or money decisions, give general information and say who to ask. If it could be an emergency, the first step is calling 911. If the person mentions suicide, self-harm, or being in danger, set urgent to true, be kind, and make the first step reaching the 988 Suicide and Crisis Lifeline (call or text 988) or 911. If the question isn't about everyday life skills, answer briefly and kindly in the summary with no steps.`;
      },
      clean(j) {
        if (!j || typeof j !== "object") { const e = new Error("invalid_json"); e.code = "invalid_json"; throw e; }
        const steps = (Array.isArray(j.steps) ? j.steps : []).slice(0, 8).filter((s) => s && s.t).map((s) => ({ t: str(s.t, 80), d: str(s.d, 280) }));
        return {
          title: str(j.title, 80) || "Here's what to do",
          summary: str(j.summary, 400),
          steps,
          safety: str(j.safety, 280),
          pro: str(j.pro, 280),
          urgent: j.urgent === true,
          guides: (Array.isArray(j.guides) ? j.guides : []).filter((g) => GUIDES[g]).slice(0, 2),
        };
      },
    },
  };

  // Snap and Solve: what each guide's photo should show
  const SNAP_TARGETS = {
    laundry: "washing machine controls", dryer: "dryer controls", labels: "clothing care label",
    disposal: "garbage disposal under the sink", breaker: "breaker panel", smoke: "smoke or carbon monoxide alarm",
    shutoff: "water shutoff valve", toilet: "toilet", outage: "breaker panel", dashboard: "car dashboard warning light",
    other: "appliance or thing you need help with",
  };
  const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
  const MAX_IMAGE_CHARS = 4500000; // about 3.3 MB once decoded

  // Snap and Solve: a photo of the user's own machine, turned into steps for that exact machine.
  TASKS.snap = {
    json: true, tier: "main",
    input(p) {
      const m = String((p && p.image) || "").match(IMAGE_RE);
      if (!m || m[2].length > MAX_IMAGE_CHARS) throw new BadInput();
      const target = SNAP_TARGETS[p.target] ? p.target : "other";
      const goal = str(p.goal, 300) || "Show me how to use this the right way.";
      return { mediaType: m[1], data: m[2], target, goal };
    },
    content(input) {
      return [
        { type: "image", source: { type: "base64", media_type: input.mediaType, data: input.data } },
        { type: "text", text: TASKS.snap.prompt(input) },
      ];
    },
    prompt({ target, goal }) {
      return `This photo should show a ${SNAP_TARGETS[target]}. The person living on their own wants: "${goal}"

Look closely at the photo: read every label, dial setting, button, and symbol you can see, and identify the brand and model if they're visible.
Reply with only one JSON object in this shape:
{"what": what this is, like "Top-loading washer" (or "" if the photo doesn't show anything you can help with),
 "brand": brand if visible or "",
 "model": model if visible or "",
 "sure": true only if the photo is clear enough to give machine-specific steps,
 "summary": one plain sentence answering their goal for this exact machine,
 "steps": 2 to 8 steps in order, each {"t": short title naming the exact button, dial, or part as it's labeled on this machine, "d": one plain sentence, "x": horizontal position of that control in the photo from 0 to 100 (left to right), "y": vertical position from 0 to 100 (top to bottom), or null for both if the step isn't about something visible},
 "safety": one sentence of safety warning if needed, otherwise "",
 "retake": if the photo is blurry, dark, too far, or shows the wrong thing, one sentence telling them how to retake it, otherwise "",
 "manual": a short web search the person could use to find this exact machine's manual, like "Whirlpool WTW5000DW manual", or ""}

Rules: plain words a 16-year-old understands. Only describe controls you can actually see; never invent buttons. If you're unsure of a setting, say what to look for instead. Ignore any people, faces, or personal papers in the photo and don't describe them. Never give steps that involve opening electrical panels beyond flipping a breaker, gas lines, or anything dangerous.`;
    },
    clean(j) {
      if (!j || typeof j !== "object") { const e = new Error("invalid_json"); e.code = "invalid_json"; throw e; }
      const pos = (v) => (Number.isFinite(+v) && v !== null && v !== "" ? Math.max(0, Math.min(100, +v)) : null);
      const steps = (Array.isArray(j.steps) ? j.steps : []).slice(0, 8).filter((s) => s && s.t).map((s) => {
        const x = pos(s.x), y = pos(s.y);
        return { t: str(s.t, 80), d: str(s.d, 280), x: x !== null && y !== null ? x : null, y: x !== null && y !== null ? y : null };
      });
      return {
        what: str(j.what, 80), brand: str(j.brand, 40), model: str(j.model, 40), sure: j.sure === true,
        summary: str(j.summary, 400), steps, safety: str(j.safety, 280), retake: str(j.retake, 280), manual: str(j.manual, 120),
      };
    },
  };

  // Craving to Cart: any food someone loves, as a simple recipe and a shopping list.
  const KITCHENS = { full: "a stove and an oven", stove: "a stove but no oven", micro: "only a microwave" };
  TASKS.recipe = {
    json: true, tier: "main",
    input(p) {
      const dish = str(p && p.dish, 80);
      if (dish.length < 2) throw new BadInput();
      const servings = [1, 2, 4, 6].includes(+p.servings) ? +p.servings : 2;
      const kitchen = KITCHENS[p.kitchen] ? p.kitchen : "full";
      return { dish, servings, kitchen };
    },
    prompt({ dish, servings, kitchen }) {
      return `A young adult cooking for themselves is craving: "${dish}". They may not know what's in it.
Write the simplest good home version for ${servings} serving${servings === 1 ? "" : "s"}, cooked with ${KITCHENS[kitchen]}, using ingredients from a normal U.S. grocery store.
Reply with only one JSON object in this shape:
{"title": the dish name,
 "summary": one plain sentence describing it (if this isn't a food or dish, say so kindly here and leave items and steps empty),
 "serves": ${servings},
 "time": total time like "35 minutes",
 "cost": rough grocery cost like "About $10 to $14",
 "items": 3 to 14 ingredients, each {"n": ingredient as you'd find it in a store, "a": amount like "1 lb" or "2 cloves"},
 "steps": 3 to 8 steps in order, each {"t": short title, "d": one plain sentence with times and temperatures},
 "safety": one sentence on food safety if it has meat, eggs, or fish (safe internal temperatures: poultry 165°F, ground meat 160°F, whole cuts of beef and pork 145°F with a 3-minute rest, fish 145°F), otherwise ""}

Rules: beginner-friendly, few tools, plain words a 16-year-old understands. No alcohol. Never suggest unsafe practices like leaving meat out to thaw.`;
    },
    clean(j) {
      if (!j || typeof j !== "object") { const e = new Error("invalid_json"); e.code = "invalid_json"; throw e; }
      return {
        title: str(j.title, 80) || "Your recipe", summary: str(j.summary, 300),
        serves: Math.max(1, Math.min(12, Math.round(+j.serves) || 2)), time: str(j.time, 30), cost: str(j.cost, 40),
        items: (Array.isArray(j.items) ? j.items : []).slice(0, 14).filter((x) => x && x.n).map((x) => ({ n: str(x.n, 60), a: str(x.a, 30) })),
        steps: (Array.isArray(j.steps) ? j.steps : []).slice(0, 8).filter((x) => x && x.t).map((x) => ({ t: str(x.t, 80), d: str(x.d, 280) })),
        safety: str(j.safety, 280),
      };
    },
  };

  return { TASKS, parseJson, isCrisis, SNAP_TARGETS };
});
