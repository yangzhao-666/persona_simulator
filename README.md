# Persona Simulator

An LLM-powered tool to test how different user personas react to app notifications. Each persona is a live AI instance with memory — they evolve day by day, and you can send notifications at any point to see how they react.

[Take a look here](https://yangzhao-666.github.io/persona_simulator/) Only the interface, no actuall LLM running.

## How It Works

1. **Select an LLM provider** — Ollama (free/local), Groq (free tier), OpenRouter (free models), or Anthropic (paid)
2. **Pick a persona** — each has a unique backstory, personality, and recovery stage
3. **Press "Next Day"** — the LLM generates what happens in their life (mood shifts, cravings, life events)
4. **Send notifications** — click any notification template and watch the persona react based on their current emotional state
5. **Monitor stats** — mood, craving, engagement, sober days update in real-time

## Personas

Each persona maps to a stage of the **Transtheoretical Model of Change**:

| Persona | Age | Occupation | Stage | Personality |
|---------|-----|------------|-------|-------------|
| **Jan** 👨‍🔧 | 52 | Construction Worker | Precontemplation | Skeptical, blunt, not tech-savvy. Wife signed him up. Drinks 4–5 beers every evening, thinks it's normal. Dry sense of humor. |
| **Lisa** 👩‍💻 | 34 | Marketing Manager | Action | Anxious, perfectionist, emotionally fragile. 2 weeks sober then relapsed. Milestone celebrations lift her. "Incomplete" messages feel like failure. |
| **Mohamed** 👨‍🎓 | 28 | PhD Student | Contemplation | Analytical, rational. Weekend binge drinker. Treats the app like a research tool. Hates patronizing language. |
| **Anja** 👵 | 61 | Retired Teacher | Maintenance | Warm, nurturing, patient. 4 months mostly sober. Lives for the forum community. Worries about holidays and family gatherings. |
| **🎲 Random** | — | — | any | Procedurally generated — new name, age, occupation, drinking pattern, motivation, and personality trait every click. |

### Random Persona Generator

Clicking **🎲 Random** generates a unique persona on the fly by combining randomised attributes:

**Names** (20 options): Emma, David, Sarah, Marco, Yuki, Fatima, Lucas, Nina, Sam, Aisha, Thomas, Priya, Carlos, Anna, Jake, Mei, Ravi, Sofia, Noah, Leila

**Occupations** (18 options): Nurse, Software Developer, Teacher, Accountant, Chef, Sales Manager, Freelancer, Warehouse Worker, Journalist, Lawyer, Graphic Designer, Shop Owner, Paramedic, Office Manager, Personal Trainer, Pharmacist, Social Worker, Electrician

**Drinking patterns:**
- Drinks 3–4 beers every evening to unwind
- Binge drinks on weekends, sometimes through Sunday
- Has a bottle of wine most nights, started during a difficult period
- Drinks heavily at social events and after stressful days
- Sneaks drinks throughout the day — functional but dependent
- Drinks to fall asleep, has done so for years
- Started drinking more after a major life change

**Motivations to join the app:**
- Signed up after a doctor's warning at a routine checkup
- Joined after an embarrassing incident at a work event
- Was encouraged by a close friend who noticed the change
- Decided on their own after a bad hangover ruined an important day
- Signed up after a family member confronted them
- Started after reading an article about alcohol dependency
- Joined after a colleague's recovery story inspired them

**Personality traits:**
- Quiet and introspective, doesn't like asking for help
- Outgoing but uses humor to deflect serious conversations
- Highly organized and anxious, needs structure and clear goals
- Skeptical of self-help but desperate enough to try
- Warm and community-oriented, thrives with peer support
- Analytical, treats everything like a problem to solve with data
- Impulsive, acts on emotion, hates being lectured
- People-pleaser who hides their struggles from others

The **stage** is also randomised, and initial state values (mood, craving, engagement, sober days, etc.) are seeded with realistic ranges per stage.

### Persona State

Each persona has a persistent state updated every day and after each notification:

| Field | Description |
|-------|-------------|
| `day` | Current simulation day |
| `phase` | App phase (1–5) |
| `mood` | 0–100, emotional wellbeing |
| `craving` | 0–100, alcohol craving intensity |
| `engagement` | 0–100, app engagement level |
| `soberDays` | Consecutive sober days (resets on relapse) |
| `drinksPerDay` | Drinks consumed today |
| `appOpensToday` | App opens today |
| `assignmentsDone` | Total assignments completed |
| `registrationsDone` | Total drink registrations logged |
| `hasBuddy` | Whether persona has a buddy |
| `forumPosts` | Total forum posts made |
| `lastAppOpen` | Days since last app open |

### Persona System Prompts

These are set once at the start and persist throughout the conversation:

**Jan:**
> You are Jan, a 52-year-old Dutch construction worker using the self-help alcohol recovery app. Your wife made you sign up after a fight about your drinking. You drink 4-5 beers every evening — you think this is normal. You're skeptical, blunt, not tech-savvy, and easily annoyed by anything preachy. Deep down you know your wife might have a point, but you'd never admit it. You have a dry sense of humor.

**Lisa:**
> You are Lisa, a 34-year-old marketing manager in Amsterdam using the self-help alcohol recovery app. You started drinking a bottle of wine most evenings during WFH. You've done 2 weeks sober once then relapsed at a friend's birthday. You're anxious, perfectionist, emotionally fragile. Milestone celebrations lift your mood. "Incomplete" or "not active" messages feel like failure. Community features are your lifeline.

**Mohamed:**
> You are Mohamed, a 28-year-old PhD student in computer science using the self-help alcohol recovery app. You binge drink at weekend uni events but don't drink during the week. You signed up after a bad hangover made you miss a meeting. You're analytical, rational, appreciate data and patterns, hate patronizing language, and approach the app like a research tool.

**Anja:**
> You are Anja, a 61-year-old retired teacher using the self-help alcohol recovery app. You started drinking wine after your husband passed 3 years ago. You've been mostly sober for 4 months. The forum community is very important to you. You have a buddy. You're warm, nurturing, patient, not very tech-savvy. You worry about holidays and family gatherings.

---

## Event Types

There are three types of events that appear in the timeline:

### 1. Life Events (`life`)

Generated automatically when you press **Next Day**. The LLM produces an in-character daily story and JSON state changes.

**Prompt sent to LLM:**
```
It is Day {day} of your journey with the recovery app.

YOUR STATE: Mood {mood}/100, Craving {craving}/100, Engagement {engagement}/100,
Sober days: {soberDays}, Phase: {phase}, Drinks today: {drinksPerDay},
Has buddy: {hasBuddy}, Forum posts: {forumPosts}, Days since last app open: {lastAppOpen}

Describe what happens to you today in 1-2 vivid sentences, first person, in character.
Then rate the impact.

Respond with ONLY this JSON:
{
  "event": "What happened today, 1-2 sentences",
  "moodChange": number -25 to 25,
  "cravingChange": number -25 to 30,
  "engagementChange": number -15 to 20,
  "didDrink": boolean,
  "drinksIfDrank": number or 0,
  "openedApp": boolean,
  "didAssignment": boolean,
  "didRegistration": boolean,
  "postedForum": boolean
}
```

**State updates from life events:**
- `mood`, `craving`, `engagement` clamped to 0–100
- `soberDays` resets to 0 if `didDrink: true`, otherwise increments by 1
- `drinksPerDay` set to `drinksIfDrank`
- `appOpensToday` increments if `openedApp: true`
- `lastAppOpen` resets to 0 if opened, otherwise increments
- `assignmentsDone`, `registrationsDone`, `forumPosts` increment on `true`

---

### 2. Notification Sent (`notif-sent`)

Logged immediately when you click a notification button — before the LLM responds. Shows which notification was sent and its delivery channel.

---

### 3. Notification Reaction (`reaction`)

Generated after a notification is sent. The LLM reacts in character based on the persona's current state.

**Prompt sent to LLM:**
```
You just received this notification on Day {day}:
NOTIFICATION: "{notif.name}" | Category: {notif.cat} | Channel: {notif.ch}

YOUR STATE: Mood {mood}/100, Craving {craving}/100, Engagement {engagement}/100,
Sober days: {soberDays}, Phase: {phase}

React in character. Respond with ONLY this JSON:
{
  "thought": "Inner monologue 1-3 sentences, reference your current state",
  "emotion": "single word",
  "action": "ignored/dismissed/glanced/read/read later/opened app/completed action/posted on forum/messaged buddy/muted/considered uninstalling",
  "moodChange": number -20 to 20,
  "cravingChange": number -20 to 15,
  "engagementChange": number -20 to 25,
  "wouldReturn": boolean,
  "designFeedback": "One practical UX insight from your perspective"
}
```

**Reaction fields:**
| Field | Description |
|-------|-------------|
| `thought` | In-character inner monologue referencing current emotional state |
| `emotion` | Single-word emotion (see emotions list below) |
| `action` | What the persona does with the notification |
| `moodChange` | Mood impact (-20 to +20) |
| `cravingChange` | Craving impact (-20 to +15) |
| `engagementChange` | Engagement impact (-20 to +25) |
| `wouldReturn` | Churn prediction — would the persona keep using the app? |
| `designFeedback` | UX insight from the persona's perspective |

**Possible actions:** `ignored`, `dismissed`, `glanced`, `read`, `read later`, `opened app`, `completed action`, `posted on forum`, `messaged buddy`, `muted`, `considered uninstalling`

**Possible emotions:** motivated, grateful, engaged, receptive, hopeful, anxious, triggered, indifferent, defensive, annoyed, hostile, overwhelmed, fatigued, disengaged, pleased, amused, confused, guilty, proud, curious, frustrated, skeptical, touched, irritated, relieved, dismissive, warm, nervous, validated, ashamed, embarrassed

---

## Notification Types

27 notifications across 9 categories:

| Notification | Category | Channel |
|-------------|----------|---------|
| Badge Received | milestone | in-app |
| Phase 1 Completed | milestone | in-app + email |
| Phase 2 Completed | milestone | in-app |
| Phase 3 Completed | milestone | in-app |
| Phase 4 Completed | milestone | in-app + email |
| Phase 5 Completed | milestone | in-app |
| Buddy Accepted | social | in-app |
| Buddy Declined | social | in-app |
| Forum Reply Received | social | in-app |
| Reply on Followed Topic | social | in-app |
| Phase Results >70% | progress | silent |
| Buddy: Phase Complete | progress | silent |
| Buddy: Phase Incomplete | progress | silent |
| Demographic Survey | assignment | silent |
| Reminder: 2 Days Inactive | check-in | in-app |
| Reminder: 7 Days Inactive | check-in | in-app |
| Reminder: 14 Days Inactive | check-in | in-app |
| Reminder: 28 Days Inactive | check-in | in-app |
| Phase Results <70% | warning | silent |
| Deactivation: 1 Month | warning | silent |
| Deactivation: 1 Week | warning | silent |
| Deactivation: Tomorrow | warning | silent |
| Welcome / Overview | onboarding | in-app |
| Buddy: 2 Weeks Inactive | re-engage | silent |
| Buddy: 4 Weeks Inactive | re-engage | silent |
| Nudge: Active | nudge | push |
| Nudge: Not Active | nudge | push |

**Delivery channels:**
- `in-app` — shown inside the app
- `push` — OS push notification
- `silent` — background/badge only, no alert
- `in-app + email` — both in-app and email notification

---

## LLM Providers

| Provider | Cost | Setup |
|----------|------|-------|
| **Ollama** | Free | Install from [ollama.com](https://ollama.com), run `ollama pull llama3.1` |
| **Groq** | Free tier | Get key at [console.groq.com](https://console.groq.com) |
| **OpenRouter** | Free models | Get key at [openrouter.ai](https://openrouter.ai), select `:free` models |
| **Anthropic** | ~$0.003/call | Get key at [console.anthropic.com](https://console.anthropic.com) |

The app maintains a **rolling 30-message conversation history** per persona to preserve character consistency across days and notifications.

---

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/persona_simulator.git
cd persona_simulator
npm install
npm run dev
```

Open `http://localhost:5173/persona_simulator/`

## Deploy to GitHub Pages

```bash
npm run deploy
```

Then go to repo **Settings → Pages → Source: gh-pages branch**.

Your site will be live at `https://YOUR_USERNAME.github.io/persona_simulator/`

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> Note: For Vercel/Netlify, remove the `base` field from `vite.config.js` since it's only needed for GitHub Pages.

## Tech Stack

- React 18 + Vite
- Any OpenAI-compatible LLM (Ollama, Groq, OpenRouter) or Anthropic API
- No other dependencies

## License

MIT
