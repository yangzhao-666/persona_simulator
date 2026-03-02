# Persona Simulator

An LLM-powered tool to test how different user personas react to app notifications. Each persona is a live AI instance with memory — they evolve day by day, and you can send notifications at any point to see how they react.

## How It Works

1. **Select an LLM provider** — Ollama (free/local), Groq (free tier), OpenRouter (free models), or Anthropic (paid)
2. **Pick a persona** — each has a unique backstory, personality, and recovery stage
3. **Press "Next Day"** — the LLM generates what happens in their life (mood shifts, cravings, life events)
4. **Send notifications** — click any notification template and watch the persona react based on their current emotional state
5. **Monitor stats** — mood, craving, engagement, sober days update in real-time

## Personas

| Persona | Age | Stage | Style |
|---------|-----|-------|-------|
| **Jan** 👨‍🔧 | 52 | Pre-contemplation | Resistant — someone else signed him up, skeptical |
| **Lisa** 👩‍💻 | 34 | Action | Anxious — motivated but fragile, fears relapse |
| **Mohamed** 👨‍🎓 | 28 | Contemplation | Analytical — treats the app like a research tool |
| **Anja** 👵 | 61 | Maintenance | Warm — 4 months sober, lives for the community |

## LLM Providers

| Provider | Cost | Setup |
|----------|------|-------|
| **Ollama** | Free | Install from [ollama.com](https://ollama.com), run `ollama pull llama3.1` |
| **Groq** | Free tier | Get key at [console.groq.com](https://console.groq.com) |
| **OpenRouter** | Free models | Get key at [openrouter.ai](https://openrouter.ai), select `:free` models |
| **Anthropic** | ~$0.003/call | Get key at [console.anthropic.com](https://console.anthropic.com) |

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
