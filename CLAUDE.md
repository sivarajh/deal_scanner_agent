# Deal Scanner Agent — Claude Code Guide

## What This Project Is

A Google ADK agent that scans PitchBook deal data and generates banker briefs. Single-agent architecture with 5 tool functions.

## Running Locally

```bash
# From the PARENT directory (one level above agent_scan_deal/)
cd C:\Users\harih\projects\ai
adk web --port 8080
```

Open http://127.0.0.1:8080 → select `deal_scanner_agent`.

## Key Files

| File | Role |
|------|------|
| `agent.py` | ADK `root_agent` — model, instruction, tool list |
| `tools.py` | All 5 tools: `load_deals`, `filter_deals`, `get_bankers`, `match_banker`, `generate_brief` |
| `.env` | `GOOGLE_API_KEY` (never commit) |

## Architecture

```
root_agent (gemini-2.5-flash)
  ├── load_deals(file_path)              → list[dict]
  ├── filter_deals(deals, min_size, vertical) → list[dict]
  ├── get_bankers()                      → list[dict]
  ├── match_banker(deal, bankers)        → dict (with match_reason)
  └── generate_brief(deal, banker)      → str (formatted brief)
```

## Important Conventions

- **Deal sizes are in millions** in the spreadsheet — $5B = 5000, $1B = 1000
- `adk web` must be run from the **parent** directory, not from inside `agent_scan_deal/`
- Imports in `agent.py` must use the full package path: `from agent_scan_deal.tools import ...`
- The ADK entry point (`root_agent`) must be named exactly `root_agent` in `agent.py`

## Adding / Changing Bankers

Edit `get_bankers()` in `tools.py`. Each banker dict needs:

```python
{
    "name": str,
    "region": str,
    "verticals": list[str],   # matched against deal Verticals + Primary PitchBook Industry Code
    "email": str,
}
```

## Changing the Data Source

The file path is hardcoded in the agent instruction in `agent.py`. Update:

```python
instruction="""...call load_deals with the file path "C:\\path\\to\\your\\file.xlsx"..."""
```

Or make it dynamic by removing the hardcoded path and letting the user provide it per session.

## Adding Email Sending

1. Add a `send_email(to, subject, body)` tool in `tools.py` using SendGrid or Gmail API
2. Add it to the `tools=[]` list in `agent.py`
3. Update the agent instruction to call it after generating each brief

## Environment Variables

```
GOOGLE_API_KEY=          # Required
DEAL_SCANNER_MODEL=      # Optional, default: gemini-2.5-flash
```

## Dependencies

```
google-adk
pandas
openpyxl
```
