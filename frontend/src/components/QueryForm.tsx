import { useState } from 'react'
import { VERTICALS, SIZE_PRESETS, type VerticalOption } from '../types'

interface Props {
  onSubmit: (query: string) => void
  loading: boolean
}

export function QueryForm({ onSubmit, loading }: Props) {
  const [vertical, setVertical] = useState<VerticalOption>('All Verticals')
  const [sizeInput, setSizeInput] = useState<string>('1000')

  function buildQuery() {
    const size = parseFloat(sizeInput) || 1000
    const verticalLabel = vertical === 'All Verticals' ? 'all' : vertical
    if (verticalLabel === 'all') {
      return `Find all deals greater than ${size} million and match them to bankers with full deal briefs and talking points.`
    }
    return `Find all ${verticalLabel} deals greater than ${size} million and match them to bankers with full deal briefs and talking points.`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(buildQuery())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Vertical selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Vertical
        </label>
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVertical(v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                vertical === v
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Deal size */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Minimum Deal Size
        </label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSizeInput(String(p.value))}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  sizeInput === String(p.value)
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[180px]">
            <span className="text-slate-500 text-sm">$</span>
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="e.g. 500"
              min={0}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-slate-500 text-sm whitespace-nowrap">M</span>
          </div>
        </div>
      </div>

      {/* Query preview */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-md px-4 py-3">
        <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Query</p>
        <p className="text-sm text-slate-300 italic">{buildQuery()}</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Scanning deals...
          </>
        ) : (
          '🔍 Scan Deals'
        )}
      </button>
    </form>
  )
}
