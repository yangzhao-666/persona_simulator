import { useState, useEffect, useRef, useCallback } from "react";

// ─── LLM Provider Configs ───
const PROVIDERS = {
  ollama: {
    name: "Ollama (Local)",
    description: "Free, runs on your machine. Install from ollama.com",
    needsKey: false,
    defaultUrl: "http://localhost:11434",
    defaultModel: "llama3.1",
    models: ["llama3.1", "llama3.2", "mistral", "gemma2", "phi3", "qwen2.5"],
  },
  groq: {
    name: "Groq (Free Tier)",
    description: "Free API with fast inference. Get key at console.groq.com",
    needsKey: true,
    defaultUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "gemma2-9b-it", "mixtral-8x7b-32768"],
  },
  openrouter: {
    name: "OpenRouter (Free Models)",
    description: "Free models available. Get key at openrouter.ai",
    needsKey: true,
    defaultUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemma-2-9b-it:free",
    models: ["google/gemma-2-9b-it:free", "mistralai/mistral-7b-instruct:free", "meta-llama/llama-3.1-8b-instruct:free", "qwen/qwen-2.5-7b-instruct:free"],
  },
  anthropic: {
    name: "Anthropic (Paid)",
    description: "Best quality. Pay-per-use at console.anthropic.com",
    needsKey: true,
    defaultUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"],
  },
};

// ─── Unified LLM Call ───
async function callLLM(provider, config, systemPrompt, messages) {
  const { url, model, apiKey } = config;

  if (provider === "anthropic") {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
    }
    const res = await fetch(`${url}/v1/messages`, {
      method: "POST", headers,
      body: JSON.stringify({ model, max_tokens: 1000, system: systemPrompt, messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Anthropic API error");
    return data.content?.map(b => b.text || "").join("") || "";
  }

  if (provider === "ollama") {
    // Ollama uses OpenAI-compatible endpoint
    const res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.message?.content || "";
  }

  // OpenAI-compatible (Groq, OpenRouter)
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (provider === "openrouter") headers["HTTP-Referer"] = window.location.origin;

  const res = await fetch(`${url}/chat/completions`, {
    method: "POST", headers,
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(text) {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  // Try to find JSON object in the text
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  return JSON.parse(cleaned);
}

// ─── Random Persona Generator ───
function rnd(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rnd(arr.length)]; }

function generateRandomPersona() {
  const name = pick(["Emma","David","Sarah","Marco","Yuki","Fatima","Lucas","Nina","Sam","Aisha","Thomas","Priya","Carlos","Anna","Jake","Mei","Ravi","Sofia","Noah","Leila"]);
  const age = 22 + rnd(45);
  const occupation = pick(["Nurse","Software Developer","Teacher","Accountant","Chef","Sales Manager","Freelancer","Warehouse Worker","Journalist","Lawyer","Graphic Designer","Shop Owner","Paramedic","Office Manager","Personal Trainer","Pharmacist","Social Worker","Electrician"]);
  const stage = pick(["precontemplation","contemplation","action","maintenance"]);
  const avatar = pick(["👨","👩","🧑","👨‍💼","👩‍💼","👨‍🔬","👩‍🔬","👨‍🎨","👩‍🎨","🧑‍💻"]);

  const pattern = pick([
    `drinks 3–4 beers every evening to unwind`,
    `binge drinks on weekends, sometimes through Sunday`,
    `has a bottle of wine most nights, started during a difficult period`,
    `drinks heavily at social events and after stressful days`,
    `sneaks drinks throughout the day — functional but dependent`,
    `drinks to fall asleep, has done so for years`,
    `started drinking more after a major life change`,
  ]);
  const motivation = pick([
    `signed up after a doctor's warning at a routine checkup`,
    `joined after an embarrassing incident at a work event`,
    `was encouraged by a close friend who noticed the change`,
    `decided on their own after a bad hangover ruined an important day`,
    `signed up after a family member confronted them`,
    `started after reading an article about alcohol dependency`,
    `joined after a colleague's recovery story inspired them`,
  ]);
  const trait = pick([
    `quiet and introspective, doesn't like asking for help`,
    `outgoing but uses humor to deflect serious conversations`,
    `highly organized and anxious, needs structure and clear goals`,
    `skeptical of self-help but desperate enough to try`,
    `warm and community-oriented, thrives with peer support`,
    `analytical, treats everything like a problem to solve with data`,
    `impulsive, acts on emotion, hates being lectured`,
    `people-pleaser who hides their struggles from others`,
  ]);

  const systemPrompt = `You are ${name}, a ${age}-year-old ${occupation} using the self-help alcohol recovery app. You ${pattern}. You ${motivation}. You are ${trait}.`;
  const bio = `${pattern.charAt(0).toUpperCase() + pattern.slice(1)}. ${motivation.charAt(0).toUpperCase() + motivation.slice(1)}.`;

  const clamp100 = v => Math.min(100, Math.max(0, v));
  const stateByStage = {
    precontemplation: { phase: 1, mood: clamp100(45 + rnd(25)), craving: clamp100(60 + rnd(25)), engagement: clamp100(10 + rnd(20)), soberDays: rnd(5),         drinksPerDay: 3 + rnd(3),  appOpensToday: 0, assignmentsDone: rnd(2),       registrationsDone: rnd(3),       hasBuddy: false,              forumPosts: rnd(2) },
    contemplation:    { phase: 2, mood: clamp100(50 + rnd(25)), craving: clamp100(35 + rnd(25)), engagement: clamp100(35 + rnd(25)), soberDays: 2 + rnd(12),      drinksPerDay: 0,           appOpensToday: 1, assignmentsDone: 1 + rnd(4),   registrationsDone: 3 + rnd(6),   hasBuddy: Math.random() > 0.7, forumPosts: rnd(3) },
    action:           { phase: 3, mood: clamp100(55 + rnd(25)), craving: clamp100(25 + rnd(30)), engagement: clamp100(60 + rnd(25)), soberDays: 5 + rnd(25),      drinksPerDay: 0,           appOpensToday: 2, assignmentsDone: 3 + rnd(7),   registrationsDone: 8 + rnd(12),  hasBuddy: Math.random() > 0.4, forumPosts: 1 + rnd(6) },
    maintenance:      { phase: 5, mood: clamp100(65 + rnd(20)), craving: clamp100(10 + rnd(25)), engagement: clamp100(70 + rnd(20)), soberDays: 60 + rnd(150),    drinksPerDay: 0,           appOpensToday: 3, assignmentsDone: 14 + rnd(12), registrationsDone: 28 + rnd(35), hasBuddy: Math.random() > 0.3, forumPosts: 8 + rnd(25) },
  };

  return { name, age, avatar, occupation, bio, stage, systemPrompt, initialState: { day: 1, lastAppOpen: 0, ...stateByStage[stage] } };
}

// ─── Persona Definitions ───
const PERSONAS = {
  jan: {
    name: "Jan", age: 52, avatar: "👨‍🔧", occupation: "Construction Worker",
    bio: "Wife signed him up. Drinks 4-5 beers every evening. Not convinced he has a problem.",
    stage: "precontemplation",
    systemPrompt: `You are Jan, a 52-year-old Dutch construction worker using the self-help alcohol recovery app. Your wife made you sign up after a fight about your drinking. You drink 4-5 beers every evening — you think this is normal. You're skeptical, blunt, not tech-savvy, and easily annoyed by anything preachy. Deep down you know your wife might have a point, but you'd never admit it. You have a dry sense of humor.`,
    initialState: { day: 1, phase: 1, mood: 55, craving: 70, engagement: 20, soberDays: 0, drinksPerDay: 4.5, appOpensToday: 0, assignmentsDone: 0, registrationsDone: 0, hasBuddy: false, forumPosts: 0, lastAppOpen: 0 },
  },
  lisa: {
    name: "Lisa", age: 34, avatar: "👩‍💻", occupation: "Marketing Manager",
    bio: "Motivated but fragile. 2 weeks sober then relapsed. Very engaged but notification-sensitive.",
    stage: "action",
    systemPrompt: `You are Lisa, a 34-year-old marketing manager in Amsterdam using the self-help alcohol recovery app. You started drinking a bottle of wine most evenings during WFH. You've done 2 weeks sober once then relapsed at a friend's birthday. You're anxious, perfectionist, emotionally fragile. Milestone celebrations lift your mood. "Incomplete" or "not active" messages feel like failure. Community features are your lifeline.`,
    initialState: { day: 1, phase: 3, mood: 60, craving: 45, engagement: 75, soberDays: 3, drinksPerDay: 0, appOpensToday: 2, assignmentsDone: 5, registrationsDone: 12, hasBuddy: true, forumPosts: 4, lastAppOpen: 0 },
  },
  mohamed: {
    name: "Mohamed", age: 28, avatar: "👨‍🎓", occupation: "PhD Student",
    bio: "Weekend binge drinker. Loves data and self-analysis. Hates anything patronizing.",
    stage: "contemplation",
    systemPrompt: `You are Mohamed, a 28-year-old PhD student in computer science using the self-help alcohol recovery app. You binge drink at weekend uni events but don't drink during the week. You signed up after a bad hangover made you miss a meeting. You're analytical, rational, appreciate data and patterns, hate patronizing language, and approach the app like a research tool.`,
    initialState: { day: 1, phase: 2, mood: 70, craving: 30, engagement: 55, soberDays: 4, drinksPerDay: 0, appOpensToday: 1, assignmentsDone: 3, registrationsDone: 6, hasBuddy: false, forumPosts: 1, lastAppOpen: 0 },
  },
  anja: {
    name: "Anja", age: 61, avatar: "👵", occupation: "Retired Teacher",
    bio: "4 months mostly sober. Lives for the forum community. Warm, patient, encouraging.",
    stage: "maintenance",
    systemPrompt: `You are Anja, a 61-year-old retired teacher using the self-help alcohol recovery app. You started drinking wine after your husband passed 3 years ago. You've been mostly sober for 4 months. The forum community is very important to you. You have a buddy. You're warm, nurturing, patient, not very tech-savvy. You worry about holidays and family gatherings.`,
    initialState: { day: 1, phase: 5, mood: 72, craving: 25, engagement: 85, soberDays: 120, drinksPerDay: 0, appOpensToday: 3, assignmentsDone: 18, registrationsDone: 45, hasBuddy: true, forumPosts: 23, lastAppOpen: 0 },
  },
};

// ─── Notification Templates ───
const NOTIFICATIONS = [
  { id: "badge", name: "Badge Received", cat: "milestone", ch: "in-app" },
  { id: "buddy_accepted", name: "Buddy Accepted", cat: "social", ch: "in-app" },
  { id: "buddy_declined", name: "Buddy Declined", cat: "social", ch: "in-app" },
  { id: "phase_1_done", name: "Phase 1 Completed", cat: "milestone", ch: "in-app + email" },
  { id: "phase_2_done", name: "Phase 2 Completed", cat: "milestone", ch: "in-app" },
  { id: "phase_3_done", name: "Phase 3 Completed", cat: "milestone", ch: "in-app" },
  { id: "phase_4_done", name: "Phase 4 Completed", cat: "milestone", ch: "in-app + email" },
  { id: "phase_5_done", name: "Phase 5 Completed", cat: "milestone", ch: "in-app" },
  { id: "results_good", name: "Phase Results >70%", cat: "progress", ch: "silent" },
  { id: "results_low", name: "Phase Results <70%", cat: "warning", ch: "silent" },
  { id: "forum_reply", name: "Forum Reply Received", cat: "social", ch: "in-app" },
  { id: "followed_reply", name: "Reply on Followed Topic", cat: "social", ch: "in-app" },
  { id: "remind_2d", name: "Reminder: 2 Days Inactive", cat: "check-in", ch: "in-app" },
  { id: "remind_7d", name: "Reminder: 7 Days Inactive", cat: "check-in", ch: "in-app" },
  { id: "remind_14d", name: "Reminder: 14 Days Inactive", cat: "check-in", ch: "in-app" },
  { id: "remind_28d", name: "Reminder: 28 Days Inactive", cat: "check-in", ch: "in-app" },
  { id: "deact_1m", name: "Deactivation: 1 Month", cat: "warning", ch: "silent" },
  { id: "deact_1w", name: "Deactivation: 1 Week", cat: "warning", ch: "silent" },
  { id: "deact_1d", name: "Deactivation: Tomorrow", cat: "warning", ch: "silent" },
  { id: "welcome", name: "Welcome / Overview", cat: "onboarding", ch: "in-app" },
  { id: "survey", name: "Demographic Survey", cat: "assignment", ch: "silent" },
  { id: "inactive_2w", name: "Buddy: 2 Weeks Inactive", cat: "re-engage", ch: "silent" },
  { id: "inactive_4w", name: "Buddy: 4 Weeks Inactive", cat: "re-engage", ch: "silent" },
  { id: "nudge_active", name: "Nudge: Active", cat: "nudge", ch: "push" },
  { id: "nudge_not_active", name: "Nudge: Not Active", cat: "nudge", ch: "push" },
  { id: "buddy_phase_done", name: "Buddy: Phase Complete", cat: "progress", ch: "silent" },
  { id: "buddy_phase_incomplete", name: "Buddy: Phase Incomplete", cat: "progress", ch: "silent" },
];

// ─── Notification Applicability ───
function getNotifReason(notif, state) {
  const { phase, hasBuddy, forumPosts, lastAppOpen, day } = state;
  switch (notif.id) {
    case "welcome":              return day > 7            ? "Past onboarding window"     : null;
    case "survey":               return phase > 2          ? "Past early phase"           : null;
    case "phase_1_done":         return phase < 2          ? "Phase 1 not finished"       : null;
    case "phase_2_done":         return phase < 3          ? "Phase 2 not reached"        : null;
    case "phase_3_done":         return phase < 4          ? "Phase 3 not reached"        : null;
    case "phase_4_done":         return phase < 5          ? "Phase 4 not reached"        : null;
    case "phase_5_done":         return phase < 5          ? "Phase 5 not reached"        : null;
    case "results_good":
    case "results_low":          return phase < 2          ? "No phase results yet"       : null;
    case "inactive_2w":
    case "inactive_4w":
    case "buddy_phase_done":
    case "buddy_phase_incomplete": return !hasBuddy        ? "No buddy"                   : null;
    case "forum_reply":
    case "followed_reply":       return forumPosts === 0   ? "Never posted on forum"      : null;
    case "remind_2d":            return lastAppOpen < 2    ? "Active recently"            : null;
    case "remind_7d":            return lastAppOpen < 7    ? "Active recently"            : null;
    case "remind_14d":           return lastAppOpen < 14   ? "Active recently"            : null;
    case "remind_28d":           return lastAppOpen < 28   ? "Active recently"            : null;
    case "deact_1m":             return lastAppOpen < 2    ? "Active recently"            : null;
    case "deact_1w":             return lastAppOpen < 23   ? "Not inactive long enough"   : null;
    case "deact_1d":             return lastAppOpen < 29   ? "Not inactive long enough"   : null;
    default:                     return null;
  }
}

// ─── RL Data Collection ───
function stateToObs(state, timeOfDay) {
  return {
    mood:             state.mood,
    craving:          state.craving,
    engagement:       state.engagement,
    soberDays:        state.soberDays,
    phase:            state.phase,
    drinksPerDay:     state.drinksPerDay,
    lastAppOpen:      state.lastAppOpen,
    hasBuddy:         state.hasBuddy ? 1 : 0,
    forumPosts:       state.forumPosts,
    assignmentsDone:  state.assignmentsDone,
    timeOfDay,        // "morning" | "afternoon" | "evening"
  };
}

function computeReward(reaction) {
  const r =
    (reaction.engagementChange || 0) * 0.4 +
    (reaction.moodChange       || 0) * 0.3 +
    -(reaction.cravingChange   || 0) * 0.3 +
    (reaction.wouldReturn ? 5 : -10);
  return Math.round(r * 100) / 100;
}

function exportJSONL(dataset) {
  const lines = dataset.map(r => JSON.stringify(r)).join("\n");
  const blob  = new Blob([lines], { type: "application/jsonl" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href      = url;
  a.download  = `rl_dataset_${Date.now()}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

const CAT_COLORS = {
  milestone: "#22c55e", social: "#8b5cf6", progress: "#3b82f6", assignment: "#6366f1",
  "check-in": "#06b6d4", warning: "#f59e0b", "re-engage": "#ef4444", onboarding: "#10b981",
  nudge: "#ec4899",
};

const EMOTION_COLORS = {
  motivated: "#22c55e", grateful: "#10b981", engaged: "#6366f1", receptive: "#3b82f6",
  hopeful: "#f59e0b", anxious: "#f97316", triggered: "#ef4444", indifferent: "#94a3b8",
  defensive: "#f97316", annoyed: "#f59e0b", hostile: "#dc2626", overwhelmed: "#ef4444",
  fatigued: "#64748b", disengaged: "#475569", pleased: "#22c55e", amused: "#a78bfa",
  confused: "#06b6d4", guilty: "#f97316", proud: "#10b981", curious: "#8b5cf6",
  frustrated: "#ef4444", skeptical: "#f59e0b", touched: "#ec4899", irritated: "#f59e0b",
  relieved: "#22c55e", dismissive: "#94a3b8", warm: "#ec4899", nervous: "#f59e0b",
  validated: "#10b981", ashamed: "#ef4444", embarrassed: "#f97316",
};

// ─── LLM Prompts ───
const JSON_INSTRUCTION = `\n\nCRITICAL: Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation before or after. Just the raw JSON.`;

const TIME_OF_DAY = [
  { id: "morning",   label: "Morning",   icon: "🌅", hint: "waking up, commute, start of day" },
  { id: "afternoon", label: "Afternoon", icon: "☀️", hint: "work hours, lunch, busy period" },
  { id: "evening",   label: "Evening",   icon: "🌙", hint: "after work, social time, highest craving risk" },
];

function lifeEventPrompt(state, timeOfDay) {
  const tod = TIME_OF_DAY.find(t => t.id === timeOfDay);
  return `It is Day ${state.day} of your journey with the recovery app. It is ${tod.label.toLowerCase()} (${tod.hint}).

YOUR STATE: Mood ${state.mood}/100, Craving ${state.craving}/100, Engagement ${state.engagement}/100, Sober days: ${state.soberDays}, Phase: ${state.phase}, Drinks today: ${state.drinksPerDay}, Has buddy: ${state.hasBuddy}, Forum posts: ${state.forumPosts}, Days since last app open: ${state.lastAppOpen}

Describe what happens to you this ${tod.label.toLowerCase()} in 1-2 vivid sentences, first person, in character. Then rate the impact.

Respond with ONLY this JSON:
{"event":"What happened, 1-2 sentences","moodChange":number -25 to 25,"cravingChange":number -25 to 30,"engagementChange":number -15 to 20,"didDrink":boolean,"drinksIfDrank":number or 0,"openedApp":boolean,"didAssignment":boolean,"didRegistration":boolean,"postedForum":boolean}`;
}

function reactionPrompt(notif, state, timeOfDay) {
  const tod = TIME_OF_DAY.find(t => t.id === timeOfDay);
  return `You just received this notification on Day ${state.day} in the ${tod.label.toLowerCase()} (${tod.hint}):
NOTIFICATION: "${notif.name}" | Category: ${notif.cat} | Channel: ${notif.ch}

YOUR STATE: Mood ${state.mood}/100, Craving ${state.craving}/100, Engagement ${state.engagement}/100, Sober days: ${state.soberDays}, Phase: ${state.phase}

React in character, considering the time of day. Respond with ONLY this JSON:
{"thought":"Inner monologue 1-3 sentences, reference your current state and the time of day","emotion":"single word","action":"ignored/dismissed/glanced/read/read later/opened app/completed action/posted on forum/messaged buddy/muted/considered uninstalling","moodChange":number -20 to 20,"cravingChange":number -20 to 15,"engagementChange":number -20 to 25,"wouldReturn":boolean,"designFeedback":"One practical UX insight from your perspective"}`;
}

// ─── Stat Bar ───
function StatBar({ label, value, color, icon }) {
  return (
    <div style={{ flex: "1 1 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: "#64748b" }}>{icon} {label}</span>
        <span style={{ fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 600, color }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Main ───
export default function App() {
  const [setupDone, setSetupDone] = useState(false);
  const [provider, setProvider] = useState("ollama");
  const [llmConfig, setLlmConfig] = useState({ url: PROVIDERS.ollama.defaultUrl, model: PROVIDERS.ollama.defaultModel, apiKey: "" });
  const [selectedPersona, setSelectedPersona] = useState("lisa");
  const [randomPersona, setRandomPersona] = useState(null);
  const [state, setState] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [convHistory, setConvHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speed, setSpeed] = useState("manual");
  const [catFilter, setCatFilter] = useState("all");
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [dataset, setDataset] = useState([]);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const autoRef = useRef(null);

  const persona = selectedPersona === "random" ? randomPersona : PERSONAS[selectedPersona];
  const providerInfo = PROVIDERS[provider];

  useEffect(() => {
    if (selectedPersona === "random") return; // handled by handleRandomClick
    setState({ ...PERSONAS[selectedPersona].initialState });
    setTimeline([]);
    setConvHistory([]);
  }, [selectedPersona]);

  const handleRandomClick = () => {
    const p = generateRandomPersona();
    setRandomPersona(p);
    setSelectedPersona("random");
    setState({ ...p.initialState });
    setTimeline([]);
    setConvHistory([]);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  useEffect(() => {
    if (speed === "auto" && !isProcessing && setupDone && state) {
      autoRef.current = setTimeout(() => advanceDay(), 2500);
    }
    return () => clearTimeout(autoRef.current);
  }, [speed, isProcessing, state, setupDone]);

  // Update config when provider changes
  useEffect(() => {
    setLlmConfig({ url: PROVIDERS[provider].defaultUrl, model: PROVIDERS[provider].defaultModel, apiKey: "" });
  }, [provider]);

  const clamp = (s) => ({ ...s, mood: Math.max(0, Math.min(100, s.mood)), craving: Math.max(0, Math.min(100, s.craving)), engagement: Math.max(0, Math.min(100, s.engagement)) });

  const advanceDay = useCallback(async () => {
    if (isProcessing || !state) return;
    setIsProcessing(true);
    setError(null);

    try {
      const prompt = lifeEventPrompt(state, timeOfDay);
      const sysPrompt = persona.systemPrompt + JSON_INSTRUCTION;
      const text = await callLLM(provider, llmConfig, sysPrompt, [...convHistory.slice(-16), { role: "user", content: prompt }]);
      const ev = parseJSON(text);

      const ns = clamp({
        ...state, day: state.day + 1,
        mood: state.mood + (ev.moodChange || 0),
        craving: state.craving + (ev.cravingChange || 0),
        engagement: state.engagement + (ev.engagementChange || 0),
        soberDays: ev.didDrink ? 0 : state.soberDays + 1,
        drinksPerDay: ev.drinksIfDrank || 0,
        appOpensToday: ev.openedApp ? state.appOpensToday + 1 : 0,
        assignmentsDone: state.assignmentsDone + (ev.didAssignment ? 1 : 0),
        registrationsDone: state.registrationsDone + (ev.didRegistration ? 1 : 0),
        forumPosts: state.forumPosts + (ev.postedForum ? 1 : 0),
        lastAppOpen: ev.openedApp ? 0 : state.lastAppOpen + 1,
      });
      setState(ns);
      setTimeline(t => [...t, { type: "life", ...ev, day: ns.day, timeOfDay, id: Date.now() }]);
      setConvHistory(h => [...h, { role: "user", content: `Day ${ns.day} ${timeOfDay}` }, { role: "assistant", content: JSON.stringify(ev) }].slice(-30));
      setDataset(d => [...d, {
        type:       "life_event",
        persona:    persona.name,
        stage:      persona.stage,
        day:        ns.day,
        timeOfDay,
        obs:        stateToObs(state, timeOfDay),
        next_obs:   stateToObs(ns, timeOfDay),
        event:      ev.event,
        didDrink:   ev.didDrink,
        openedApp:  ev.openedApp,
      }]);
      if (speed === "auto") {
        const idx = TIME_OF_DAY.findIndex(t => t.id === timeOfDay);
        setTimeOfDay(TIME_OF_DAY[(idx + 1) % TIME_OF_DAY.length].id);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to generate. Check your LLM connection.");
      setSpeed("manual");
    }
    setIsProcessing(false);
  }, [isProcessing, state, persona, convHistory, provider, llmConfig, timeOfDay, speed]);

  const sendNotification = useCallback(async (notif) => {
    if (isProcessing || !state) return;
    setIsProcessing(true);
    setError(null);

    setTimeline(t => [...t, { type: "notif-sent", notif, day: state.day, timeOfDay, id: Date.now() }]);

    try {
      const prompt = reactionPrompt(notif, state, timeOfDay);
      const sysPrompt = persona.systemPrompt + JSON_INSTRUCTION;
      const text = await callLLM(provider, llmConfig, sysPrompt, [...convHistory.slice(-20), { role: "user", content: prompt }]);
      const reaction = parseJSON(text);

      const ns = clamp({
        ...state,
        mood: state.mood + (reaction.moodChange || 0),
        craving: state.craving + (reaction.cravingChange || 0),
        engagement: state.engagement + (reaction.engagementChange || 0),
      });
      setState(ns);
      setTimeline(t => [...t, { type: "reaction", ...reaction, notif, day: state.day, id: Date.now() + 1 }]);
      setConvHistory(h => [...h, { role: "user", content: `Notif: "${notif.name}"` }, { role: "assistant", content: JSON.stringify(reaction) }].slice(-30));
      const reward = computeReward(reaction);
      setDataset(d => [...d, {
        type:        "notification",
        persona:     persona.name,
        stage:       persona.stage,
        day:         state.day,
        timeOfDay,
        obs:         stateToObs(state, timeOfDay),
        next_obs:    stateToObs(ns, timeOfDay),
        action: {
          notif_id:  notif.id,
          notif_cat: notif.cat,
          notif_ch:  notif.ch,
        },
        reaction: {
          thought:          reaction.thought,
          emotion:          reaction.emotion,
          action:           reaction.action,
          moodChange:       reaction.moodChange,
          cravingChange:    reaction.cravingChange,
          engagementChange: reaction.engagementChange,
          wouldReturn:      reaction.wouldReturn,
          designFeedback:   reaction.designFeedback,
        },
        reward,
        done: !reaction.wouldReturn,
      }]);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to generate reaction.");
    }
    setIsProcessing(false);
  }, [isProcessing, state, persona, convHistory, provider, llmConfig, timeOfDay]);

  const filteredNotifs = catFilter === "all" ? NOTIFICATIONS : NOTIFICATIONS.filter(n => n.cat === catFilter);

  // ─── Setup Screen ───
  if (!setupDone) {
    return (
      <div style={{ minHeight: "100vh", background: "#06070b", color: "#e2e8f0", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 480, width: "100%", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
              Persona Simulator
            </h1>
            <p style={{ color: "#64748b", fontSize: 12 }}>Living personas powered by LLM</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 8 }}>LLM Provider</label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <button key={key} onClick={() => setProvider(key)} style={{
                  background: provider === key ? "rgba(129,140,248,0.08)" : "rgba(255,255,255,0.015)",
                  border: provider === key ? "1.5px solid rgba(129,140,248,0.35)" : "1.5px solid rgba(255,255,255,0.05)",
                  borderRadius: 7, padding: "8px 10px", cursor: "pointer", textAlign: "left", color: "#e2e8f0",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{p.description}</div>
                </button>
              ))}
            </div>

            {/* Model selector */}
            <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>Model</label>
            <select value={llmConfig.model} onChange={e => setLlmConfig(c => ({ ...c, model: e.target.value }))} style={{
              width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
              fontFamily: "JetBrains Mono", marginBottom: 12, outline: "none",
            }}>
              {providerInfo.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* URL */}
            <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>API URL</label>
            <input value={llmConfig.url} onChange={e => setLlmConfig(c => ({ ...c, url: e.target.value }))} style={{
              width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 11,
              fontFamily: "JetBrains Mono", marginBottom: 12, outline: "none",
            }} />

            {/* API Key (if needed) */}
            {providerInfo.needsKey && (
              <>
                <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4 }}>API Key</label>
                <input type="password" value={llmConfig.apiKey} onChange={e => setLlmConfig(c => ({ ...c, apiKey: e.target.value }))} placeholder={provider === "anthropic" ? "sk-ant-..." : "gsk_... / sk-or-..."} style={{
                  width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6, padding: "8px 10px", color: "#e2e8f0", fontSize: 11,
                  fontFamily: "JetBrains Mono", marginBottom: 12, outline: "none",
                }} />
              </>
            )}

            {provider === "ollama" && (
              <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 6, padding: "8px 10px", marginBottom: 12, fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                <strong style={{ color: "#22c55e" }}>Setup Ollama:</strong><br />
                1. Install from <a href="https://ollama.com" target="_blank" style={{ color: "#22c55e" }}>ollama.com</a><br />
                2. Run: <code style={{ color: "#818cf8" }}>ollama pull {llmConfig.model}</code><br />
                3. Start with CORS: <code style={{ color: "#818cf8" }}>OLLAMA_ORIGINS=* ollama serve</code><br />
                That's it — completely free, runs locally
              </div>
            )}

            <button onClick={() => setSetupDone(true)} disabled={providerInfo.needsKey && !llmConfig.apiKey.trim()} style={{
              width: "100%", background: "#6366f1", border: "none", borderRadius: 7, padding: "10px",
              color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
              opacity: (providerInfo.needsKey && !llmConfig.apiKey.trim()) ? 0.4 : 1,
            }}>
              Start Simulator
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state || !persona) return null;

  const moodColor = state.mood > 65 ? "#22c55e" : state.mood > 40 ? "#f59e0b" : "#ef4444";
  const cravingColor = state.craving > 60 ? "#ef4444" : state.craving > 30 ? "#f59e0b" : "#22c55e";
  const engColor = state.engagement > 60 ? "#22c55e" : state.engagement > 30 ? "#f59e0b" : "#ef4444";

  // ─── Main UI ───
  return (
    <div style={{ minHeight: "100vh", background: "#06070b", color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "14px 14px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Persona Simulator
            </h1>
            <span style={{ fontSize: 8, color: "#64748b", background: "rgba(255,255,255,0.04)", padding: "2px 5px", borderRadius: 3 }}>
              {providerInfo.name} · {llmConfig.model}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {dataset.length > 0 && (
              <button onClick={() => exportJSONL(dataset)} style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 5, padding: "4px 9px", color: "#22c55e", cursor: "pointer", fontSize: 10 }}>
                ⬇ Export {dataset.length} samples
              </button>
            )}
            <button onClick={() => setSpeed(speed === "auto" ? "manual" : "auto")} style={{ background: speed === "auto" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)", border: "1px solid " + (speed === "auto" ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"), borderRadius: 5, padding: "4px 9px", color: speed === "auto" ? "#22c55e" : "#64748b", cursor: "pointer", fontSize: 10 }}>
              {speed === "auto" ? "⏸ Pause" : "▶ Auto"}
            </button>
            <button onClick={advanceDay} disabled={isProcessing} style={{ background: "#6366f1", border: "none", borderRadius: 5, padding: "4px 10px", color: "#fff", fontSize: 10, fontWeight: 600, cursor: isProcessing ? "wait" : "pointer", opacity: isProcessing ? 0.5 : 1 }}>
              Next Day →
            </button>
            <button onClick={() => { setSetupDone(false); setSpeed("manual"); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, padding: "4px 8px", color: "#475569", cursor: "pointer", fontSize: 10 }}>⚙️</button>
          </div>
        </div>

        {/* Error bar */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "7px 10px", marginBottom: 8, fontSize: 11, color: "#fca5a5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        )}

        {/* Persona selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 8 }}>
          {Object.entries(PERSONAS).map(([key, p]) => (
            <button key={key} onClick={() => setSelectedPersona(key)} style={{
              background: selectedPersona === key ? "rgba(129,140,248,0.06)" : "rgba(255,255,255,0.01)",
              border: selectedPersona === key ? "1.5px solid rgba(129,140,248,0.25)" : "1.5px solid rgba(255,255,255,0.03)",
              borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left", color: "#e2e8f0",
            }}>
              <span style={{ fontSize: 15 }}>{p.avatar}</span>
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 5 }}>{p.name}, {p.age}</span>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{p.bio}</div>
            </button>
          ))}
          <button onClick={handleRandomClick} style={{
            background: selectedPersona === "random" ? "rgba(236,72,153,0.06)" : "rgba(255,255,255,0.01)",
            border: selectedPersona === "random" ? "1.5px dashed rgba(236,72,153,0.35)" : "1.5px dashed rgba(255,255,255,0.08)",
            borderRadius: 6, padding: "6px 8px", cursor: "pointer", textAlign: "left", color: "#e2e8f0",
          }}>
            <span style={{ fontSize: 15 }}>🎲</span>
            <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 5, color: selectedPersona === "random" ? "#ec4899" : "#94a3b8" }}>Random</span>
            <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>
              {selectedPersona === "random" && randomPersona ? `${randomPersona.name}, ${randomPersona.age} · ${randomPersona.stage}` : "Generate a random persona"}
            </div>
          </button>
        </div>

        {/* Stats */}
        <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 7, padding: "8px 12px", marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ textAlign: "center", minWidth: 40 }}>
            <div style={{ fontSize: 7, color: "#475569", textTransform: "uppercase" }}>Day</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "JetBrains Mono", color: "#818cf8" }}>{state.day}</div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {TIME_OF_DAY.map(t => (
              <button key={t.id} onClick={() => setTimeOfDay(t.id)} title={t.hint} style={{
                background: timeOfDay === t.id ? "rgba(129,140,248,0.1)" : "transparent",
                border: timeOfDay === t.id ? "1px solid rgba(129,140,248,0.3)" : "1px solid transparent",
                borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 9,
                color: timeOfDay === t.id ? "#818cf8" : "#475569",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.05)" }} />
          <StatBar label="Mood" value={state.mood} color={moodColor} icon="😊" />
          <StatBar label="Craving" value={state.craving} color={cravingColor} icon="🍺" />
          <StatBar label="Engagement" value={state.engagement} color={engColor} icon="📱" />
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#94a3b8", flexWrap: "wrap" }}>
            <span>🏆 {state.soberDays}d sober</span>
            <span>📋 {state.assignmentsDone} tasks</span>
            <span>💬 {state.forumPosts} posts</span>
            <span>📖 P{state.phase}</span>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 8 }}>
          {/* Notifications */}
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 7, padding: 8, maxHeight: 460, overflowY: "auto" }}>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, color: "#475569", marginBottom: 4 }}>Notifications</div>
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 5 }}>
              {["all", ...new Set(NOTIFICATIONS.map(n => n.cat))].map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{ background: catFilter === c ? (CAT_COLORS[c] || "#818cf8") + "10" : "transparent", border: "none", borderRadius: 3, padding: "2px 4px", color: catFilter === c ? (CAT_COLORS[c] || "#818cf8") : "#475569", cursor: "pointer", fontSize: 7, fontFamily: "Outfit" }}>
                  {c}
                </button>
              ))}
            </div>
            {filteredNotifs.map(n => {
              const reason = state ? getNotifReason(n, state) : null;
              return (
                <button key={n.id} onClick={() => sendNotification(n)} disabled={isProcessing} style={{
                  width: "100%", textAlign: "left", background: reason ? "transparent" : "rgba(255,255,255,0.005)",
                  border: `1px solid ${reason ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)"}`, borderRadius: 4,
                  padding: "5px 6px", marginBottom: 2, cursor: isProcessing ? "wait" : "pointer",
                  color: reason ? "#334155" : "#d1d5db", fontFamily: "Outfit", opacity: isProcessing ? 0.4 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 500 }}>{n.name}</div>
                    {reason && <span style={{ fontSize: 6, color: "#334155", flexShrink: 0 }}>{reason}</span>}
                  </div>
                  <div style={{ fontSize: 7, color: reason ? "#2d3748" : (CAT_COLORS[n.cat] || "#64748b") }}>{n.cat} · {n.ch}</div>
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 7, padding: 8, maxHeight: 460, overflowY: "auto" }}>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, color: "#475569", marginBottom: 5 }}>
              {persona.avatar} {persona.name}'s Journey
            </div>

            {timeline.length === 0 && (
              <div style={{ textAlign: "center", padding: "45px 14px", color: "#334155" }}>
                <div style={{ fontSize: 30, opacity: 0.4, marginBottom: 5 }}>{persona.avatar}</div>
                <div style={{ fontSize: 12 }}>Press <strong>Next Day</strong> to start</div>
              </div>
            )}

            {timeline.map(entry => {
              if (entry.type === "life") {
                const mc = entry.moodChange || 0, cc = entry.cravingChange || 0;
                return (
                  <div key={entry.id} style={{ display: "flex", gap: 6, marginBottom: 7, animation: "si 0.3s" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 28 }}>
                      <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "#475569" }}>D{entry.day}</div>
                      <div style={{ fontSize: 8 }}>{TIME_OF_DAY.find(t => t.id === entry.timeOfDay)?.icon ?? ""}</div>
                      <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.035)", borderRadius: 6, padding: "6px 8px" }}>
                      <div style={{ fontSize: 11, lineHeight: 1.5, color: "#d1d5db" }}>{entry.event}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 8, color: mc >= 0 ? "#22c55e" : "#ef4444" }}>😊{mc > 0 ? "+" : ""}{mc}</span>
                        <span style={{ fontSize: 8, color: cc <= 0 ? "#22c55e" : "#ef4444" }}>🍺{cc > 0 ? "+" : ""}{cc}</span>
                        {entry.didDrink && <span style={{ fontSize: 8, color: "#ef4444", fontWeight: 600 }}>🍷 Drank</span>}
                        {entry.openedApp && <span style={{ fontSize: 8, color: "#3b82f6" }}>📱</span>}
                        {entry.didAssignment && <span style={{ fontSize: 8, color: "#22c55e" }}>📋</span>}
                        {entry.postedForum && <span style={{ fontSize: 8, color: "#8b5cf6" }}>💬</span>}
                      </div>
                    </div>
                  </div>
                );
              }
              if (entry.type === "notif-sent") {
                return (
                  <div key={entry.id} style={{ display: "flex", gap: 6, marginBottom: 2, animation: "si 0.2s" }}>
                    <div style={{ minWidth: 28 }} />
                    <div style={{ flex: 1, background: (CAT_COLORS[entry.notif.cat] || "#64748b") + "06", border: `1px solid ${CAT_COLORS[entry.notif.cat] || "#64748b"}12`, borderRadius: 5, padding: "4px 7px" }}>
                      <span style={{ fontSize: 9, color: CAT_COLORS[entry.notif.cat] || "#94a3b8" }}>🔔 {entry.notif.name}</span>
                      <span style={{ fontSize: 7, color: "#475569", marginLeft: 5 }}>{entry.notif.ch}</span>
                      {entry.timeOfDay && <span style={{ fontSize: 7, color: "#334155", marginLeft: 4 }}>{TIME_OF_DAY.find(t => t.id === entry.timeOfDay)?.icon} {entry.timeOfDay}</span>}
                    </div>
                  </div>
                );
              }
              if (entry.type === "reaction") {
                const ec = EMOTION_COLORS[entry.emotion] || "#94a3b8";
                return (
                  <div key={entry.id} style={{ display: "flex", gap: 6, marginBottom: 8, animation: "si 0.3s" }}>
                    <div style={{ minWidth: 28 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ background: ec + "08", border: `1px solid ${ec}15`, borderRadius: 5, padding: "6px 8px" }}>
                        <div style={{ fontSize: 11, lineHeight: 1.5, color: "#d1d5db", fontStyle: "italic", marginBottom: 4 }}>"{entry.thought}"</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ background: ec + "12", color: ec, padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 600 }}>{entry.emotion}</span>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>{entry.action}</span>
                          <span style={{ marginLeft: "auto", fontSize: 7, fontFamily: "JetBrains Mono", color: entry.wouldReturn ? "#22c55e" : "#ef4444" }}>
                            {entry.wouldReturn ? "✓ keep" : "✗ churn"}
                          </span>
                        </div>
                      </div>
                      {entry.designFeedback && (
                        <div style={{ marginTop: 2, padding: "3px 7px", fontSize: 9, color: "#94a3b8", borderLeft: "2px solid rgba(129,140,248,0.15)", borderRadius: "0 3px 3px 0" }}>
                          💡 {entry.designFeedback}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {isProcessing && (
              <div style={{ display: "flex", gap: 6, opacity: 0.5 }}>
                <div style={{ minWidth: 28 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px" }}>
                  <div style={{ width: 9, height: 9, border: "1.5px solid rgba(129,140,248,0.2)", borderTop: "1.5px solid #818cf8", borderRadius: "50%", animation: "sp 0.7s linear infinite" }} />
                  <span style={{ fontSize: 9, color: "#64748b" }}>Generating...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes si { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sp { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.05); border-radius:2px; }
        button:hover { filter:brightness(1.08); }
        input::placeholder { color:#334155; }
        select { appearance: none; }
      `}</style>
    </div>
  );
}
