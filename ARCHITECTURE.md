# Deal Intelligence — Architecture

## Overview

A full-stack investment banking tool powered by a Google ADK agent (Gemini) that scans PitchBook deal data, matches deals to regional bankers, and generates startup intelligence briefs. A React frontend streams results in real time with step-by-step pipeline visibility.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Agent framework | Google ADK (`google-adk`) |
| LLM | `gemini-2.5-flash` (override via `DEAL_SCANNER_MODEL` env var) |
| Backend server | ADK Web (`adk web --port 8090`) |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| Data source | `pitchbook_deals.xlsx` (27 PitchBook deals) |

---

## Repository Structure

```
agent_scan_deal/
├── agent.py                  # ADK root_agent definition + sub-agent for search
├── tools.py                  # 6 tool functions
├── pitchbook_deals.xlsx      # Deal source data
├── requirements.txt
├── .env                      # GOOGLE_API_KEY (never committed)
├── ARCHITECTURE.md
├── CLAUDE.md
├── README.md
├── .claude/
│   └── launch.json           # Dev server launch config
└── frontend/
    ├── vite.config.ts        # Proxy /apps, /run_sse → ADK server
    ├── src/
    │   ├── App.tsx           # Root layout — mode tabs, left/right panels
    │   ├── types.ts          # Shared types, pipeline step definitions
    │   ├── api/
    │   │   └── adkClient.ts  # createSession() + streamRun() SSE parser
    │   ├── hooks/
    │   │   └── useAgentStream.ts  # Streaming state, step tracking
    │   └── components/
    │       ├── QueryForm.tsx        # Deal Scanner form
    │       ├── ResearchForm.tsx     # Intelligence Briefing form
    │       ├── StepTracker.tsx      # Pipeline progress indicator
    │       └── StreamOutput.tsx     # Output renderer (markdown + cards)
```

---

## Backend Components

### `agent.py` — Agent Definition

Defines two agents:

- **`root_agent`** (`deal_scanner_agent`) — main agent with all tools; handles both Deal Scanner and Intelligence Briefing modes based on the user's request
- **`_search_agent`** (`web_search_agent`) — sub-agent wrapping `google_search`, exposed to the root agent via `AgentTool`

> **Why a sub-agent for search?** Gemini cannot combine built-in tools (like `google_search`) with custom function tools in the same request. Wrapping it in an `AgentTool` sub-agent makes it appear as a regular function call to the root agent.

### `tools.py` — Tool Functions

| Tool | Description |
|------|-------------|
| `load_deals(file_path)` | Reads the Excel file with pandas; returns all deals as a list of dicts |
| `filter_deals(deals, min_size_millions, vertical)` | Filters deals by minimum size and vertical (case-insensitive partial match; `"all"` skips vertical filter) |
| `get_bankers()` | Returns 6 hardcoded regional bankers, each with name, region, verticals, and email |
| `match_banker(deal, bankers)` | Scores bankers by vertical overlap with the deal; returns best match with reason |
| `process_deals(deals, bankers)` | **Batch tool** — runs `match_banker` + `generate_brief` for all deals in a single Python call, eliminating N×2 LLM round-trips |
| `format_intelligence_brief(...)` | Formats a structured startup intelligence brief from 8 research fields into a fixed-section string |

**Banker Roster:**

| Banker | Region | Verticals |
|--------|--------|-----------|
| Sarah Chen | West | Technology, SaaS, CloudTech, AI |
| Michael Torres | South | Oil & Gas, Energy, Utilities |
| James Richardson | Northeast | Manufacturing, Industrials, Logistics |
| Priya Patel | Midwest | FinTech, E-Commerce, Financial Services |
| David Kim | West | Life Sciences, Healthcare, BioTech |
| Rachel Morgan | National | Infrastructure, Data Centers, Telecom |

---

## Frontend Components

### `App.tsx` — Root Layout

- Renders the top navigation bar with mode toggle tabs
- Maintains two independent `useAgentStream` instances (one per mode) so state is preserved when switching tabs
- Left panel: form (`QueryForm` or `ResearchForm` based on mode)
- Right panel: `StepTracker` + `StreamOutput`

### `QueryForm.tsx` — Deal Scanner Form

- Vertical dropdown (All, Oil & Gas, Manufacturing, AI, Industrials, FinTech, E-Commerce, SaaS, Life Sciences, CloudTech)
- Min deal size input with presets: $100M, $500M, $1B, $5B
- Constructs a natural language query sent to the agent

### `ResearchForm.tsx` — Intelligence Briefing Form

- Company name text input
- Example chips: Databricks, Rippling, Anthropic, Canva, Stripe
- "What this researches" info panel
- Constructs a comprehensive research query for the agent

### `StepTracker.tsx` — Pipeline Progress

Displays each pipeline step with three states:

| State | Appearance |
|-------|-----------|
| `pending` | Dimmed icon + label |
| `active` | Pulsing indigo dot + "Running" badge |
| `done` | Green checkmark + "Done" badge |

**Deal Scanner steps:** Load → Filter → Bankers → Generate Briefs

**Intelligence Briefing steps:** Company Profile → Funding History → Valuation → Capital Needs → Generate Brief

### `StreamOutput.tsx` — Output Renderer

Parses the raw streamed text into typed blocks by splitting on `==========` separator lines:

| Block Type | Component | Theme |
|-----------|-----------|-------|
| `summary` | `SummaryBlock` | Markdown via `react-markdown` + `remark-gfm` |
| `brief` | `DealBriefCard` | Indigo accent |
| `intel` | `IntelligenceBriefCard` | Violet accent |

Both card types use shared sub-components: `CardHeader`, `SectionList`, `BriefRow`.

`BriefRow` handles three row formats:
- **Numbered points** — `1. Label: text` → rendered with a numbered badge
- **Key-value rows** — `CEO: John Smith` → label/value split layout
- **Plain text** — rendered as a paragraph

### `useAgentStream.ts` — Streaming Hook

Manages the full streaming lifecycle:
- Creates an ADK session on first submit (reuses it for follow-up queries)
- Calls `streamRun()` and appends text chunks to output state
- Maps `functionCall` events to step IDs to advance `StepTracker`
- Resets all state on new search

**Tool → Step mapping (Deal Scanner):**

| Tool Called | Step Activated |
|-------------|---------------|
| `load_deals` | Load |
| `filter_deals` | Filter |
| `get_bankers` | Bankers |
| `process_deals` | Generate Briefs |

**Tool → Step mapping (Intelligence Briefing):**

| Tool Called | Step Activated |
|-------------|---------------|
| `web_search_agent` (1st call) | Company Profile |
| `web_search_agent` (2nd call) | Funding History |
| `web_search_agent` (3rd call) | Valuation |
| `web_search_agent` (4th call) | Capital Needs |
| `format_intelligence_brief` | Generate Brief |

### `adkClient.ts` — API Layer

**`createSession(userId)`** — POSTs to `/apps/agent_scan_deal/users/{userId}/sessions` and returns the session ID.

**`streamRun(...)`** — POSTs to `/run_sse` with SSE streaming. Parses each event's `content.parts` array:

| Part Type | Action |
|-----------|--------|
| `functionCall` | Calls `onToolCall(name)` to advance the step tracker |
| `functionResponse` (for `process_deals` or `format_intelligence_brief`) | Extracts `.output` / `.result` / `.content` and calls `onText()` — sets `briefEmitted = true` |
| `functionResponse` (all others) | Skipped — never shown as model text |
| `text` | Calls `onText()` — suppressed if `briefEmitted` and the text looks like a brief echo |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React)                       │
│                                                             │
│  User Input (QueryForm / ResearchForm)                      │
│       │                                                     │
│       ▼                                                     │
│  useAgentStream.submit(query)                               │
│       │                                                     │
│       ├─ POST /apps/.../sessions  →  session_id             │
│       │                                                     │
│       └─ POST /run_sse (SSE)                                │
│              │                                              │
│              │  SSE events                                  │
│              ├─ functionCall  →  StepTracker (activate)     │
│              ├─ functionResponse → StreamOutput (brief text)│
│              └─ text          →  StreamOutput (commentary)  │
└─────────────────────────────────────────────────────────────┘
                        │ proxy (Vite)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   ADK Server (:8090)                        │
│                                                             │
│  root_agent (gemini-2.5-flash)                              │
│       │                                                     │
│  MODE 1 — Deal Scanner                                      │
│       ├─ load_deals()                                       │
│       ├─ filter_deals()                                     │
│       ├─ get_bankers()                                      │
│       └─ process_deals()  ← batch: match + brief all deals  │
│                                                             │
│  MODE 2 — Intelligence Briefing                             │
│       ├─ web_search_agent()  ← sub-agent with google_search │
│       └─ format_intelligence_brief()                        │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
              pitchbook_deals.xlsx
              (27 deals, loaded on demand)
```

---

## Two Operating Modes

### Mode 1 — Deal Scanner

1. User selects vertical and minimum deal size
2. Agent loads all deals from the Excel file
3. Agent filters by size and vertical
4. Agent fetches the banker roster
5. Agent runs `process_deals` — matches each deal to the best banker and generates a formatted brief, all in one Python call
6. UI renders a summary table followed by individual deal brief cards

### Mode 2 — Intelligence Briefing

1. User enters a company name
2. Agent sends a single comprehensive search query via `web_search_agent` (CEO, CFO, investors, funding rounds, valuation, capital needs)
3. Agent calls `format_intelligence_brief` with all gathered data
4. UI renders an intelligence brief card with sections: Executive Profile, Lead Investors, Funding History, Valuation Analysis, Capital Needs Assessment, Outreach Strategy

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ | — | Gemini API key |
| `DEAL_SCANNER_MODEL` | ❌ | `gemini-2.5-flash` | Override the Gemini model |

---

## Running Locally

```bash
# 1. Start ADK agent (from parent directory)
cd C:\Users\harih\projects\ai
adk web --port 8090

# 2. Start React UI (from frontend directory)
cd agent_scan_deal\frontend
npm run dev
# → http://localhost:4000
```
