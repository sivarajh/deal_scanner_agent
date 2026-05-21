export type AppMode = 'scan' | 'research'

export type StepStatus = 'pending' | 'active' | 'done'

export interface Step {
  id: string
  label: string
  detail?: string
  status: StepStatus
}

// ─── Deal Scanner ────────────────────────────────────────────────────────────

export type VerticalOption =
  | 'All Verticals'
  | 'Oil & Gas'
  | 'Manufacturing'
  | 'Artificial Intelligence'
  | 'Industrials'
  | 'FinTech'
  | 'E-Commerce'
  | 'SaaS'
  | 'Life Sciences'
  | 'CloudTech'
  | 'Advanced Manufacturing'

export const VERTICALS: VerticalOption[] = [
  'All Verticals',
  'Oil & Gas',
  'Manufacturing',
  'Artificial Intelligence',
  'Industrials',
  'FinTech',
  'E-Commerce',
  'SaaS',
  'Life Sciences',
  'CloudTech',
  'Advanced Manufacturing',
]

export const SIZE_PRESETS = [
  { label: '$100M', value: 100 },
  { label: '$500M', value: 500 },
  { label: '$1B',   value: 1000 },
  { label: '$5B',   value: 5000 },
]

export const SCAN_PIPELINE_STEPS: Omit<Step, 'status'>[] = [
  { id: 'load',    label: 'Loading deals',                detail: 'Reading PitchBook data…' },
  { id: 'filter',  label: 'Filtering by criteria',        detail: 'Applying size & vertical filters…' },
  { id: 'bankers', label: 'Fetching banker roster',        detail: 'Loading regional bankers…' },
  { id: 'process', label: 'Matching & generating briefs', detail: 'Scoring verticals and writing briefs…' },
]

// ─── Intelligence Briefing ───────────────────────────────────────────────────

export const RESEARCH_PIPELINE_STEPS: Omit<Step, 'status'>[] = [
  { id: 'profile',   label: 'Company profile',    detail: 'Searching executives & overview…' },
  { id: 'funding',   label: 'Funding history',    detail: 'Researching rounds & investors…' },
  { id: 'valuation', label: 'Valuation analysis', detail: 'Estimating current valuation…' },
  { id: 'needs',     label: 'Capital needs',      detail: 'Assessing venture debt / IPO readiness…' },
  { id: 'brief',     label: 'Generating brief',   detail: 'Writing outreach strategy…' },
]
