# Persona Simulator

An LLM-powered tool to simulate how different user personas react to app notifications. Each persona is a live AI instance with persistent memory — they evolve day by day, and you can fire notifications at any point to observe realistic reactions, emotional impact, and UX feedback.

[**Live demo →**](https://yangzhao-666.github.io/persona_simulator/) *(interface only — no LLM connected)*

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/persona_simulator.git
cd persona_simulator
npm install
npm run dev
# Open http://localhost:5173/persona_simulator/
```

---

## How It Works

```
Select LLM provider → Pick persona → Set time of day
  → Next Day      — LLM generates a life event in character
  → Send notif    — LLM reacts based on current state + time of day
  → Repeat        — stats update in real-time across the timeline
```

**Auto mode** advances days automatically every 2.5 seconds, cycling through Morning → Afternoon → Evening with each step.

---

## Personas

Each persona represents a stage of the **Transtheoretical Model of Change**:

| Persona | Age | Occupation | Stage | Description |
|---------|-----|------------|-------|-------------|
| **Jan** 👨‍🔧 | 52 | Construction Worker | Precontemplation | Skeptical, blunt. Wife signed him up. Drinks 4–5 beers nightly, thinks it's normal. |
| **Lisa** 👩‍💻 | 34 | Marketing Manager | Action | Anxious, perfectionist. Relapsed once. Milestone-driven, notification-sensitive. |
| **Mohamed** 👨‍🎓 | 28 | PhD Student | Contemplation | Analytical, data-oriented. Weekend binge drinker. Hates patronizing language. |
| **Anja** 👵 | 61 | Retired Teacher | Maintenance | Warm, community-focused. 4 months sober. Lives for the forum. |
| **🎲 Random** | varies | varies | any | Procedurally generated from attribute pools (see below). |

### Random Persona Generator

Each click on **🎲 Random** combines:

- **Name** — 20 options (Emma, David, Sarah, Marco, Yuki, Fatima, Lucas, Nina, …)
- **Age** — 22–66
- **Occupation** — 18 options (Nurse, Developer, Teacher, Chef, Journalist, Paramedic, …)
- **Stage** — randomised (precontemplation / contemplation / action / maintenance)
- **Drinking pattern** — e.g. *"binge drinks on weekends"*, *"drinks to fall asleep"*, *"sneaks drinks throughout the day"*
- **Motivation** — e.g. *"doctor's warning"*, *"embarrassing incident at work"*, *"family confrontation"*
- **Personality trait** — e.g. *"analytical, treats everything like a problem to solve"*, *"impulsive, hates being lectured"*

Initial state values (mood, craving, engagement, sober days, etc.) are seeded with realistic ranges per stage.

### Persona State

Each persona carries a persistent state object updated after every day-advance and notification:

| Field | Description |
|-------|-------------|
| `day` | Current simulation day |
| `phase` | App phase (1–5) |
| `mood` | 0–100 — emotional wellbeing |
| `craving` | 0–100 — alcohol craving intensity |
| `engagement` | 0–100 — app engagement level |
| `soberDays` | Consecutive sober days (resets on relapse) |
| `drinksPerDay` | Drinks consumed today |
| `appOpensToday` | App opens today |
| `assignmentsDone` | Total assignments completed |
| `registrationsDone` | Total drink registrations logged |
| `hasBuddy` | Whether the persona has a buddy |
| `forumPosts` | Total forum posts made |
| `lastAppOpen` | Days since last app open |

---

## Time of Day

A **Morning / Afternoon / Evening** toggle sits in the stats bar and is passed into every LLM prompt.

| Slot | Context hint |
|------|-------------|
| 🌅 Morning | Waking up, commute, start of day |
| ☀️ Afternoon | Work hours, lunch, busy period |
| 🌙 Evening | After work, social time, highest craving risk |

In **manual mode** the toggle stays under your control. In **auto mode** it cycles automatically with each day-advance (Morning → Afternoon → Evening → Morning…).

---

## Event Types

### 1. Life Event

Generated on each **Next Day** press. The LLM writes an in-character daily story and returns state changes.

**Prompt:**
```
It is Day {day} of your journey with the recovery app. It is {timeOfDay} ({hint}).

YOUR STATE: Mood {mood}/100, Craving {craving}/100, Engagement {engagement}/100,
Sober days: {soberDays}, Phase: {phase}, Drinks today: {drinksPerDay},
Has buddy: {hasBuddy}, Forum posts: {forumPosts}, Days since last app open: {lastAppOpen}

Describe what happens to you this {timeOfDay} in 1-2 vivid sentences, first person, in character.

{
  "event": "string",
  "moodChange": -25 to 25,
  "cravingChange": -25 to 30,
  "engagementChange": -15 to 20,
  "didDrink": boolean,
  "drinksIfDrank": number,
  "openedApp": boolean,
  "didAssignment": boolean,
  "didRegistration": boolean,
  "postedForum": boolean
}
```

**State update rules:**
- `soberDays` resets to 0 if `didDrink: true`, otherwise increments
- `lastAppOpen` resets to 0 if `openedApp: true`, otherwise increments
- All numeric stats clamped to 0–100

---

### 2. Notification Sent

Logged immediately when you click a notification — before the LLM responds. Shows the notification name, delivery channel, and time of day.

---

### 3. Notification Reaction

Generated after a notification is sent. The LLM responds in character.

**Prompt:**
```
You just received this notification on Day {day} in the {timeOfDay} ({hint}):
NOTIFICATION: "{name}" | Category: {cat} | Channel: {ch}

YOUR STATE: Mood {mood}/100, Craving {craving}/100, Engagement {engagement}/100,
Sober days: {soberDays}, Phase: {phase}

React in character, considering the time of day.

{
  "thought": "Inner monologue 1-3 sentences referencing state and time of day",
  "emotion": "single word",
  "action": "ignored / dismissed / glanced / read / read later / opened app /
             completed action / posted on forum / messaged buddy / muted /
             considered uninstalling",
  "moodChange": -20 to 20,
  "cravingChange": -20 to 15,
  "engagementChange": -20 to 25,
  "wouldReturn": boolean,
  "designFeedback": "One practical UX insight from the persona's perspective"
}
```

| Field | Description |
|-------|-------------|
| `thought` | In-character inner monologue |
| `emotion` | Single-word emotion (motivated, anxious, hostile, relieved, …) |
| `action` | What the persona does with the notification |
| `wouldReturn` | Churn indicator — would they keep using the app? |
| `designFeedback` | UX insight from the persona's perspective |

---

## Notifications

27 notifications across 9 categories. Inapplicable ones are dimmed based on current state (e.g. buddy notifications when `hasBuddy: false`, inactivity reminders when the user opened the app recently).

| Category | Notifications |
|----------|--------------|
| **milestone** | Badge Received, Phase 1–5 Completed |
| **social** | Buddy Accepted, Buddy Declined, Forum Reply Received, Reply on Followed Topic |
| **progress** | Phase Results >70%, Phase Results <70%, Buddy: Phase Complete, Buddy: Phase Incomplete |
| **check-in** | Reminder: 2 / 7 / 14 / 28 Days Inactive |
| **warning** | Deactivation: 1 Month / 1 Week / Tomorrow |
| **onboarding** | Welcome / Overview |
| **assignment** | Demographic Survey |
| **re-engage** | Buddy: 2 Weeks Inactive, Buddy: 4 Weeks Inactive |
| **nudge** | Nudge: Active, Nudge: Not Active |

**Delivery channels:** `in-app` · `in-app + email` · `push` · `silent`

### Applicability Rules

| Condition | Affected notifications |
|-----------|----------------------|
| `day > 7` | Welcome dimmed |
| `phase <= 2` | Survey active; dimmed after |
| `phase < X` | Phase X Completed dimmed |
| `!hasBuddy` | All buddy notifications dimmed |
| `forumPosts === 0` | Forum Reply, Followed Reply dimmed |
| `lastAppOpen < threshold` | Inactivity reminders and deactivation warnings dimmed |

---

## LLM Providers

| Provider | Cost | Notes |
|----------|------|-------|
| **Ollama** | Free | Local. Install from [ollama.com](https://ollama.com), run `ollama pull llama3.1`, start with `OLLAMA_ORIGINS=* ollama serve` |
| **Groq** | Free tier | Fast inference. Key at [console.groq.com](https://console.groq.com) |
| **OpenRouter** | Free models | Select `:free` models. Key at [openrouter.ai](https://openrouter.ai) |
| **Anthropic** | ~$0.003/call | Best quality. Key at [console.anthropic.com](https://console.anthropic.com) |

The app keeps a **rolling 30-message conversation history** per persona to maintain character consistency across days.

---

## Deployment

**GitHub Pages:**
```bash
npm run deploy
# Then: Settings → Pages → Source: gh-pages branch
```

**Vercel / Netlify:**
Remove the `base` field from `vite.config.js` (only needed for GitHub Pages), then deploy normally.

---

## Tech Stack

- React 18 + Vite
- OpenAI-compatible LLMs (Ollama, Groq, OpenRouter) or Anthropic API
- No backend, no database — all state is in-memory

---

## License

MIT
