import { useState } from 'react'

interface Props {
  onSubmit: (query: string) => void
  loading: boolean
}

const EXAMPLES = ['Databricks', 'Rippling', 'Anthropic', 'Canva', 'Stripe']

export function ResearchForm({ onSubmit, loading }: Props) {
  const [company, setCompany] = useState('')

  function buildQuery(name: string) {
    return `Build a comprehensive intelligence brief for ${name}. Research their CEO, CFO, lead Series D investors, all funding rounds with dates and amounts, estimated current valuation, and capital needs (venture debt, treasury management, IPO readiness, M&A support). Generate a targeted outreach strategy tailored to their current growth stage.`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (company.trim()) onSubmit(buildQuery(company.trim()))
  }

  function handleExample(name: string) {
    setCompany(name)
    onSubmit(buildQuery(name))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company input */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Company Name
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Databricks, Rippling…"
          disabled={loading}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
        />
      </div>

      {/* Quick examples */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Quick Examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => handleExample(ex)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 hover:bg-violet-900/40 hover:text-violet-300 ring-1 ring-slate-700 hover:ring-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800" />

      {/* What this does */}
      <div className="rounded-lg bg-slate-800/40 ring-1 ring-slate-700/50 px-4 py-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Researches</p>
        {[
          '👤 CEO & CFO profiles',
          '💰 All funding rounds & investors',
          '📈 Valuation analysis',
          '🎯 Capital needs assessment',
          '📬 Targeted outreach strategy',
        ].map((item) => (
          <p key={item} className="text-xs text-slate-400">{item}</p>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !company.trim()}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 ring-1 ring-violet-500"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Researching…
          </>
        ) : (
          <>🔎 Build Intelligence Brief</>
        )}
      </button>
    </form>
  )
}
