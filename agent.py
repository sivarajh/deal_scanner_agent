import os
from pathlib import Path

from google.adk.agents import Agent

from agent_scan_deal.tools import load_deals, filter_deals, get_bankers, process_deals

MODEL = os.getenv("DEAL_SCANNER_MODEL", "gemini-2.5-flash")

# Path to the deals file, relative to this package — works regardless of where adk is launched from
DEALS_FILE = str(Path(__file__).parent / "pitchbook_deals.xlsx")

root_agent = Agent(
    name="deal_scanner_agent",
    model=MODEL,
    description="PitchBook deal scanner that filters deals by size and vertical, matches them to regional bankers, and generates detailed briefs with talking points.",
    instruction=f"""You are a deal scanning agent for an investment bank. Your job is to help bankers find relevant deals from PitchBook data.

WORKFLOW — follow these steps in order, one tool call each:
1. Call load_deals with file path "{DEALS_FILE}"
2. Call filter_deals with the loaded deals, the minimum size (in millions), and the vertical ("all" if not specified)
3. Call get_bankers to get the banker roster
4. Call process_deals with the filtered deals and bankers — this matches and generates ALL briefs in one shot
5. Present the result: first a summary table (Company | Deal Size | Vertical | Assigned Banker), then the briefs

IMPORTANT:
- Deal sizes are in MILLIONS: $5B = 5000, $1B = 1000, $500M = 500
- Always use process_deals (not match_banker/generate_brief individually) — it is faster
- If no deals match, say so and suggest broadening the criteria""",
    tools=[load_deals, filter_deals, get_bankers, process_deals],
)
