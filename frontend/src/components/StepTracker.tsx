import type { Step } from '../types'

interface Props {
  steps: Step[]
  loading: boolean
}

const ICONS: Record<string, string> = {
  // Deal scanner
  load:      '📂',
  filter:    '🔍',
  bankers:   '👥',
  process:   '⚡',
  // Intelligence briefing
  profile:   '👤',
  funding:   '💰',
  valuation: '📈',
  needs:     '🎯',
  brief:     '📝',
}

export function StepTracker({ steps, loading }: Props) {
  const hasActivity = loading || steps.some((s) => s.status !== 'pending')
  if (!hasActivity) return null

  return (
    <div className="animate-slide-in rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 mb-6 backdrop-blur">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
        Agent Pipeline
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} index={i} />
        ))}
      </div>
    </div>
  )
}

function StepRow({ step, index }: { step: Step; index: number }) {
  const isActive  = step.status === 'active'
  const isDone    = step.status === 'done'
  const isPending = step.status === 'pending'

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-300 ${
        isPending ? 'opacity-35' : 'opacity-100'
      }`}
    >
      {/* Step number / check */}
      <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
        {isDone ? (
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isActive ? (
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 step-dot-active" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center">
            <span className="text-[11px] text-slate-600 font-mono">{index + 1}</span>
          </div>
        )}
      </div>

      {/* Icon + label */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base leading-none">{ICONS[step.id]}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium leading-none ${
            isDone    ? 'text-emerald-400' :
            isActive  ? 'text-indigo-300'  :
                        'text-slate-500'
          }`}>
            {step.label}
          </p>
          {isActive && step.detail && (
            <p className="text-[11px] text-slate-500 mt-1 truncate">{step.detail}</p>
          )}
        </div>
      </div>

      {/* Right status badge */}
      <div className="shrink-0">
        {isDone && (
          <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Done
          </span>
        )}
        {isActive && (
          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Running
          </span>
        )}
      </div>
    </div>
  )
}
