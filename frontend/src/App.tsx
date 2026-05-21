import { useState } from 'react'
import { QueryForm }    from './components/QueryForm'
import { ResearchForm } from './components/ResearchForm'
import { StreamOutput } from './components/StreamOutput'
import { StepTracker }  from './components/StepTracker'
import { useAgentStream } from './hooks/useAgentStream'
import { SCAN_PIPELINE_STEPS, RESEARCH_PIPELINE_STEPS, type AppMode } from './types'

export default function App() {
  const [mode, setMode] = useState<AppMode>('scan')

  const scan     = useAgentStream('scan')
  const research = useAgentStream('research')

  const active = mode === 'scan' ? scan : research
  const steps  = mode === 'scan'
    ? active.steps.length ? active.steps : SCAN_PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as const }))
    : active.steps.length ? active.steps : RESEARCH_PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as const }))

  function switchMode(next: AppMode) {
    setMode(next)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0a0f1e]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-base">📊</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-none tracking-tight">Deal Intelligence</h1>
              <p className="text-[10px] text-slate-600 mt-0.5">PitchBook · Banker Matching · Startup Research</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {active.loading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 step-dot-active" />
                <span className="text-[10px] font-semibold text-indigo-400">Processing</span>
              </div>
            )}
            {(active.output || active.error) && !active.loading && (
              <button
                onClick={active.reset}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 ring-1 ring-transparent hover:ring-slate-700"
              >
                ↺ New Search
              </button>
            )}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 pb-0">
          {([
            { id: 'scan',     label: '🔍 Deal Scanner',          accent: 'indigo' },
            { id: 'research', label: '🔎 Intelligence Briefing', accent: 'violet' },
          ] as const).map(({ id, label, accent }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                mode === id
                  ? accent === 'indigo'
                    ? 'text-indigo-300 border-indigo-500 bg-indigo-500/5'
                    : 'text-violet-300 border-violet-500 bg-violet-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex gap-8 flex-1 items-start">

        {/* Left panel */}
        <aside className="w-72 shrink-0">
          <div className={`sticky top-24 rounded-xl border bg-slate-900/60 p-5 shadow-2xl backdrop-blur transition-colors ${
            mode === 'scan' ? 'border-slate-800' : 'border-violet-900/50'
          }`}>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
              {mode === 'scan' ? 'Filters' : 'Company Research'}
            </p>
            {mode === 'scan'
              ? <QueryForm    onSubmit={scan.submit}     loading={scan.loading} />
              : <ResearchForm onSubmit={research.submit} loading={research.loading} />
            }
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 min-w-0 space-y-0">
          <StepTracker steps={active.steps} loading={active.loading} />
          <StreamOutput output={active.output} loading={active.loading} error={active.error} />
        </main>

      </div>
    </div>
  )
}
