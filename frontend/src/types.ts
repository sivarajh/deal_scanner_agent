export interface RunRequest {
  app_name: string
  user_id: string
  session_id: string
  new_message: {
    role: 'user'
    parts: Array<{ text: string }>
  }
  streaming: boolean
}

export interface AgentEvent {
  content?: {
    parts?: Array<{ text?: string }>
    role?: string
  }
  error?: string
}

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
  { label: '$1B', value: 1000 },
  { label: '$5B', value: 5000 },
]
