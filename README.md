# Deal Scanner Agent

A Google ADK agent that scans PitchBook deal data, filters deals by size and vertical, matches them to regional bankers, and generates detailed deal briefs with talking points.

## What It Does

1. **Loads** deals from a PitchBook Excel export
2. **Filters** deals above a minimum size threshold in a given vertical
3. **Matches** each deal to the best regional banker based on vertical coverage
4. **Generates** a formatted deal brief with company overview, deal details, investor info, and 5 talking points

## Project Structure

```
agent_scan_deal/
├── agent.py               # Google ADK root agent definition
├── tools.py               # Tool functions: load, filter, match, brief
├── pitchbook_deals.xlsx   # Sample deal data (27 deals, included in repo)
├── __init__.py            # Python package marker
├── requirements.txt       # Dependencies
├── .env                   # API keys (not committed — create locally)
└── README.md              # This file
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/sivarajh/deal_scanner_agent.git
cd deal_scanner_agent
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set your Google API key

Create a `.env` file in the project directory:

```
GOOGLE_API_KEY=your_google_api_key_here
```

Get a key at [https://aistudio.google.com](https://aistudio.google.com).

### 4. Deal data file

The PitchBook deals file (`pitchbook_deals.xlsx`) is included in the repo and loaded automatically — no path configuration needed. To use your own file, replace `pitchbook_deals.xlsx` in the project folder with your export.

## Running the Agent

Run `adk web` from the **parent directory** (one level above `agent_scan_deal/`):

```bash
cd ..
adk web --port 8080
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080) in your browser and select **deal_scanner_agent**.

## Example Queries

| Query | What happens |
|-------|-------------|
| `Find all deals greater than 5 billion` | Returns all deals ≥ $5B across all verticals |
| `Show me Oil & Gas deals over 1 billion` | Filters by vertical + size, matches to Michael Torres (South) |
| `What Industrials deals are over 500 million?` | Returns Industrials/Manufacturing deals, matches to James Richardson |
| `Any AI deals above 100 million?` | Filters for AI/Technology vertical, matches to Sarah Chen |

## Banker Roster (Sample Data)

| Banker | Region | Verticals |
|--------|--------|-----------|
| Sarah Chen | West | Technology, SaaS, CloudTech, AI |
| Michael Torres | South | Oil & Gas, Energy, Electric Utilities |
| James Richardson | Northeast | Manufacturing, Industrials, Logistics |
| Priya Patel | Midwest | FinTech, E-Commerce, Financial Services |
| David Kim | West | Life Sciences, Healthcare, BioTech |
| Rachel Morgan | National | Infrastructure, Data Centers, Telecom |

Replace these with your real banker data in `tools.py` → `get_bankers()`.

## Deal Size Convention

Sizes in the PitchBook spreadsheet are in **millions**:

| User says | Means | Filter value |
|-----------|-------|-------------|
| $5 million | $5M | 5 |
| $500 million | $500M | 500 |
| $1 billion | $1B | 1000 |
| $5 billion | $5B | 5000 |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | — | Required. Your Google AI Studio API key |
| `DEAL_SCANNER_MODEL` | `gemini-2.5-flash` | Gemini model to use |

## Requirements

- Python 3.11+
- `google-adk`
- `pandas`
- `openpyxl`
