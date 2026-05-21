import { QueryForm }    from './components/QueryForm'
import { StreamOutput } from './components/StreamOutput'
import { StepTracker }  from './components/StepTracker'
import { useAgentStream } from './hooks/useAgentStream'

export default function App() {
  const { output, loading, error, steps, submit, reset } = useAgentStream()
  const hasResults = output || loading || error

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
              <h1 className="text-sm font-bold text-slate-100 leading-none tracking-tight">
                Deal Scanner
              </h1>
              <p className="text-[10px] text-slate-600 mt-0.5">PitchBook · Banker Matching</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            {loading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 step-dot-active" />
                <span className="text-[10px] font-semibold text-indigo-400">Processing</span>
              </div>
            )}
            {hasResults && !loading && (
              <button
                onClick={reset}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 ring-1 ring-transparent hover:ring-slate-700"
              >
                ↺ New Search
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex gap-8 flex-1 items-start">

        {/* Left panel */}
        <aside className="w-72 shrink-0">
          <div className="sticky top-20 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
              Filters
            </p>
            <QueryForm onSubmit={submit} loading={loading} />
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 min-w-0 space-y-0">
          <StepTracker steps={steps} loading={loading} />
          <StreamOutput output={output} loading={loading} error={error} />
        </main>

      </div>
    </div>
  )
}
