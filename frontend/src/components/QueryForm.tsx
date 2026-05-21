import { useState } from 'react'
import { VERTICALS, SIZE_PRESETS, type VerticalOption } from '../types'

interface Props {
  onSubmit: (query: string) => void
  loading: boolean
}

export function QueryForm({ onSubmit, loading }: Props) {
  const [vertical,  setVertical]  = useState<VerticalOption>('All Verticals')
  const [sizeInput, setSizeInput] = useState<string>('1000')

  function buildQuery() {
    const size = parseFloat(sizeInput) || 1000
    const v    = vertical === 'All Verticals' ? 'all' : vertical
    if (v === 'all') {
      return `Find all deals greater than ${size} million and match them to bankers with full deal briefs and talking points.`
    }
    return `Find all ${v} deals greater than ${size} million and match them to bankers with full deal briefs and talking points.`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(buildQuery())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Vertical */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Vertical
        </label>
        <div className="flex flex-wrap gap-1.5">
          {VERTICALS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVertical(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                vertical === v
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-500'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 ring-1 ring-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Minimum Deal Size
        </label>
        <div className="flex gap-1.5 mb-2.5">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setSizeInput(String(p.value))}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                sizeInput === String(p.value)
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-500'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 ring-1 ring-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-sm font-mono">$</span>
          <input
            type="number"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="e.g. 500"
            min={0}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <span className="text-slate-600 text-sm">M</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800" />

      {/* Query preview */}
      <div className="rounded-lg bg-slate-800/40 ring-1 ring-slate-700/50 px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5">Query preview</p>
        <p className="text-xs text-slate-400 italic leading-relaxed">{buildQuery()}</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 ring-1 ring-indigo-500"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Scanning…
          </>
        ) : (
          <>🔍 Scan Deals</>
        )}
      </button>
    </form>
  )
}
