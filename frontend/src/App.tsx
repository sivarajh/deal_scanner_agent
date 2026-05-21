import { QueryForm } from './components/QueryForm'
import { StreamOutput } from './components/StreamOutput'
import { useAgentStream } from './hooks/useAgentStream'

export default function App() {
  const { output, loading, error, submit, reset } = useAgentStream()

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">Deal Scanner</h1>
              <p className="text-xs text-slate-500 mt-0.5">PitchBook · Regional Banker Matching</p>
            </div>
          </div>
          {output && (
            <button
              onClick={reset}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800"
            >
              ↺ New Search
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex gap-8 flex-1">
        {/* Left panel — filters */}
        <aside className="w-80 shrink-0">
          <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
              Filter Deals
            </h2>
            <QueryForm onSubmit={submit} loading={loading} />
          </div>
        </aside>

        {/* Right panel — output */}
        <main className="flex-1 min-w-0">
          <StreamOutput output={output} loading={loading} error={error} />
        </main>
      </div>
    </div>
  )
}
