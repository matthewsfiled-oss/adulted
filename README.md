# Adulted

The life skills school never taught. Step-by-step guides with a picture for every step, a panic button for emergencies, a first apartment checklist, and Ask Anything, an AI helper that answers real-life questions with clear steps.

All six modules are live: **Home**, **Money**, **Living on your own**, **Food**, **Health and admin**, and **Car**, with 44 picture guides in total. Also included: Murphy's Law (the Ready tab, emergency kits, crisis and step-in guides), Snap and Solve (photo help for your exact machine or dashboard light), Craving to Cart (AI recipes plus a shopping list), a budget calculator, Where you stand (age comparisons), and the Free, Silver, and Gold plans screen.

It's built exactly like Pathwise, so the same setup steps apply.

| Where | What people see |
|---|---|
| `your-site.com/` | Landing page with a signup for the phone app |
| `your-site.com/app` | The full app in any browser |
| Android | The same app, installed, working offline |

---

## Launch checklist

### 1. Accounts

Use the same accounts as Pathwise: GitHub, the [Anthropic Console](https://console.anthropic.com) (you can reuse your API key or make a new one), [Render](https://render.com), [Neon](https://neon.com), and [Expo](https://expo.dev).

Check that the name "Adulted" is free to use before you buy a domain or print anything (search the USPTO trademark database and the app stores).

### 2. Database (Neon)

In Neon, create a new project called `adulted` and copy its **connection string** (starts with `postgresql://`). The tables are created automatically.

### 3. Website and web app (Render)

1. In Render: **New > Blueprint**, pick this repository. Render reads `render.yaml`.
2. Paste `ANTHROPIC_API_KEY` and `DATABASE_URL` when it asks.
3. Click **Apply**. The first build takes a few minutes.
4. Open the address Render gives you. `/` is the landing page and `/app` is the app.

Then put that address in two places and commit:
- `siteUrl` in `shared/data.js`
- both `EXPO_PUBLIC_API_URL` values in `app/eas.json`

Admin downloads (your `ADMIN_KEY` is on the service's **Environment** tab):
- Launch list signups: `https://YOUR-ADDRESS/api/admin/waitlist.csv?key=YOUR_ADMIN_KEY`
- Reports about AI answers: `https://YOUR-ADDRESS/api/admin/reports.csv?key=YOUR_ADMIN_KEY` (check these weekly; Google Play expects you to act on them)

**Cost control:** each person is rate limited, and `DAILY_AI_LIMIT` (default 1,000) caps all AI calls per day. Free users get 3 Ask Anything questions a day inside the app (`askPerDay` in `shared/data.js`). Also set a monthly spend limit in the Anthropic Console.

### 4. Android app for testers

**One-time setup:** in GitHub, go to **Settings > Secrets and variables > Actions > New repository secret** and add `EXPO_TOKEN` (expo.dev > your avatar > **Account settings > Access tokens**). You can reuse the Pathwise token.

**Each build:** **Actions > Build Android app > Run workflow**, pick `preview`. The run's summary links to the build. When it says Finished (10 to 20 minutes), tap **Install** on your phone. Pick `production` for the `.aab` file the Play Store needs.

Expo creates and stores this app's signing key on the first build, so there's no passphrase to keep this time. Every future update is signed with that same key automatically.

### 5. Before the Play Store

- Privacy policy URL: `https://adulted.onrender.com/privacy`
- Google Play requires its own billing for Silver and Gold. When that's hooked up, set `paymentsLive: true` in `shared/data.js`. Until then the plans screen says "Opens soon."
- Have someone check the guides (a plumber and an electrician for those guides), and have a mental health professional review the crisis wording in `shared/prompts.js`.
- The step pictures are shaded illustrations, with real photos on some laundry steps. Real photos or short videos can replace any of them: add `img` or `video` to a step in `shared/data.js`.

---

## Run it on your own computer

You need Node.js 20+.

```
npm run build          # builds the screens into server/web and app/src
cd server
cp .env.example .env   # then paste your ANTHROPIC_API_KEY into .env
npm start
```

Open http://localhost:3001 for the landing page and http://localhost:3001/app for the app.

## What's in this folder

| Folder | What it is |
|---|---|
| `web/app.html` | Every screen: Home, Learn, modules, guides, Ask Anything, Snap and Solve, Craving to Cart, shopping list, budget calculator, Ready, Me, Plans |
| `web/illustrations.js` | The step pictures (amber always marks where to look) |
| `shared/data.js` | Guides, emergency numbers, checklist, plans and prices |
| `shared/prompts.js` | What Ask Anything asks Claude, and how answers are checked |
| `scripts/build-web.js` | Combines the above into the web app and the phone app's copy |
| `server/` | Website, launch list, and the API that talks to Claude. Holds your AI key so the app never does. |
| `app/` | The phone app: shows the screens and saves data on the phone |

## Change the basics

| What | Where |
|---|---|
| Guides and steps | `GUIDES` in `shared/data.js` |
| Prices, questions per day | `CONFIG` and `TIERS` in `shared/data.js` |
| Emergency numbers | `RESOURCES` in `shared/data.js` |
| First apartment checklist | `CHECKLISTS` in `shared/data.js` |
| What Ask Anything tells Claude | `shared/prompts.js` |
| Landing page words | `server/public/index.html` |

After any change in `web/` or `shared/`, run `node scripts/build-web.js` and commit the result.

## Tests

```
npm test    # guide checks, prompt checks, server routes (fake AI, no key needed)
```
