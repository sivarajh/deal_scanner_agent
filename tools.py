import pandas as pd


def load_deals(file_path: str) -> list[dict]:
    """Load deals from a PitchBook Excel file and return as a list of dicts."""
    df = pd.read_excel(file_path)
    df["Deal Size"] = pd.to_numeric(df["Deal Size"], errors="coerce")
    df["Post Valuation"] = pd.to_numeric(df["Post Valuation"], errors="coerce")
    df = df.fillna("")
    return df.to_dict(orient="records")


def filter_deals(deals: list[dict], min_size_millions: float, vertical: str = "all") -> list[dict]:
    """Filter deals by minimum size (in millions) and optionally by vertical.

    Args:
        deals: List of deal dicts from load_deals.
        min_size_millions: Minimum deal size in millions (e.g. 5000 for $5B).
        vertical: Vertical to filter by, or 'all' for no vertical filter.
    """
    results = []
    for d in deals:
        size = d.get("Deal Size", 0)
        if not isinstance(size, (int, float)) or size < min_size_millions:
            continue
        if vertical.lower() != "all":
            deal_verticals = str(d.get("Verticals", "")).lower()
            deal_industry = str(d.get("Primary PitchBook Industry Code", "")).lower()
            query = vertical.lower()
            if query not in deal_verticals and query not in deal_industry:
                continue
        results.append(d)
    return results


def get_bankers() -> list[dict]:
    """Return the roster of regional bankers with their vertical coverage."""
    return [
        {"name": "Sarah Chen", "region": "West", "verticals": ["Technology", "SaaS", "CloudTech", "Artificial Intelligence"], "email": "schen@bank.com"},
        {"name": "Michael Torres", "region": "South", "verticals": ["Oil & Gas", "Energy", "Electric Utilities"], "email": "mtorres@bank.com"},
        {"name": "James Richardson", "region": "Northeast", "verticals": ["Manufacturing", "Industrials", "Logistics", "Advanced Manufacturing"], "email": "jrichardson@bank.com"},
        {"name": "Priya Patel", "region": "Midwest", "verticals": ["FinTech", "E-Commerce", "Financial Services", "Restaurants"], "email": "ppatel@bank.com"},
        {"name": "David Kim", "region": "West", "verticals": ["Life Sciences", "Healthcare", "BioTech"], "email": "dkim@bank.com"},
        {"name": "Rachel Morgan", "region": "National", "verticals": ["Infrastructure", "Data Centers", "Telecommunications", "Systems and Information"], "email": "rmorgan@bank.com"},
    ]


def match_banker(deal: dict, bankers: list[dict]) -> dict:
    """Match a deal to the best banker based on vertical/industry overlap.

    Returns the matched banker dict with an added 'match_reason' field.
    """
    deal_verticals = str(deal.get("Verticals", "")).lower()
    deal_industry = str(deal.get("Primary PitchBook Industry Code", "")).lower()
    deal_text = f"{deal_verticals} {deal_industry}"

    best_banker = None
    best_score = 0

    for banker in bankers:
        score = 0
        matched_on = []
        for v in banker["verticals"]:
            v_lower = v.lower()
            # Check both directions and partial prefix matches (data may be truncated)
            if v_lower in deal_text or any(v_lower.startswith(token.rstrip(".")) for token in deal_text.split() if len(token) > 3):
                score += 1
                matched_on.append(v)
            elif any(token.rstrip(".") in v_lower for token in deal_text.split() if len(token) > 3):
                score += 0.5
                matched_on.append(v)
        if score > best_score:
            best_score = score
            best_banker = {**banker, "match_reason": f"Covers: {', '.join(matched_on)}"}

    if not best_banker:
        national = next((b for b in bankers if b["region"] == "National"), bankers[0])
        best_banker = {**national, "match_reason": "National coverage (no direct vertical match)"}

    return best_banker


def process_deals(deals: list[dict], bankers: list[dict]) -> str:
    """Match every deal to a banker and generate all deal briefs in one call.

    This is the fast path — use this instead of calling match_banker and
    generate_brief individually for each deal. Processes all deals in a single
    Python pass, eliminating N×2 LLM round-trips.

    Args:
        deals: Filtered list of deals from filter_deals.
        bankers: Banker roster from get_bankers.

    Returns:
        All formatted deal briefs concatenated as a single string.
    """
    if not deals:
        return "No deals to process."

    briefs = []
    for deal in deals:
        banker = match_banker(deal, bankers)
        briefs.append(generate_brief(deal, banker))

    return "\n\n".join(briefs)


def generate_brief(deal: dict, banker: dict) -> str:
    """Generate a formatted deal brief for a banker."""
    size_display = f"${deal.get('Deal Size', 0):,.0f}M"
    valuation_display = f"${deal.get('Post Valuation', 0):,.0f}M" if deal.get("Post Valuation") else "N/A"

    brief = f"""
================================================================================
DEAL BRIEF: {deal.get('Company', 'Unknown')}
================================================================================

COMPANY OVERVIEW
  Company:     {deal.get('Company', 'N/A')}
  Description: {deal.get('Description', 'N/A')}
  Vertical:    {deal.get('Verticals', 'N/A') or deal.get('Primary PitchBook Industry Code', 'N/A')}
  Status:      {deal.get('Business Status', 'N/A')}

DEAL DETAILS
  Deal Size:       {size_display}
  Post Valuation:  {valuation_display}
  Deal Type:       {deal.get('Deal Type', 'N/A')} — {deal.get('Deal Type 2', 'N/A')}
  Deal Date:       {deal.get('Deal Date', 'N/A')}
  Deal Status:     {deal.get('Deal Status', 'N/A')}
  Financing:       {deal.get('Financing Status', 'N/A')}
  Synopsis:        {deal.get('Deal Synopsis', 'N/A')}

INVESTORS
  {deal.get('Investors', 'N/A')}

ASSIGNED BANKER
  Name:    {banker.get('name')}
  Region:  {banker.get('region')}
  Email:   {banker.get('email')}
  Reason:  {banker.get('match_reason')}

SUGGESTED TALKING POINTS
  1. Deal Positioning: This {deal.get('Deal Type', '')} at {size_display} represents a significant opportunity in the {deal.get('Verticals', '') or deal.get('Primary PitchBook Industry Code', 'N/A')} space.
  2. Competitive Landscape: Key investors include {deal.get('Investors', 'undisclosed parties')} — understand their thesis and co-investment appetite.
  3. Valuation Context: At {valuation_display} post-money, benchmark against comparable recent transactions in this vertical.
  4. Strategic Fit: Assess how {deal.get('Company', 'the company')} aligns with our existing portfolio companies and LP relationships.
  5. Timing: Deal is currently {deal.get('Deal Status', 'N/A')} — determine urgency and next steps for engagement.
================================================================================
"""
    return brief.strip()
