import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  output: string
  loading: boolean
  error: string | null
}

export function StreamOutput({ output, loading, error }: Props) {
  if (error) {
    return (
      <div className="animate-slide-in rounded-xl bg-red-950/40 border border-red-800/60 p-5 flex gap-3">
        <span className="text-xl shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-red-300 mb-1">Something went wrong</p>
          <p className="text-xs text-red-400/80 font-mono break-all">{error}</p>
        </div>
      </div>
    )
  }

  if (!output && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 select-none">
        <div className="text-6xl mb-5 opacity-20">📊</div>
        <p className="text-sm text-slate-600">Results will appear here</p>
      </div>
    )
  }

  const blocks = parseBlocks(output)

  return (
    <div className="space-y-5 animate-slide-in">
      {blocks.map((block, i) => {
        if (block.type === 'summary')
          return <SummaryBlock key={i} text={block.text} loading={loading && i === blocks.length - 1} />
        if (block.type === 'intel')
          return <IntelligenceBriefCard key={i} text={block.text} />
        return <DealBriefCard key={i} text={block.text} index={block.index ?? i} />
      })}
      {loading && blocks.length === 0 && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-400 step-dot-active" />
          <span>Agent is thinking…</span>
        </div>
      )}
    </div>
  )
}

// ─── Block parser ─────────────────────────────────────────────────────────────

interface Block { type: 'summary' | 'brief' | 'intel'; text: string; index?: number }

function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = []
  const segments = raw.split(/\n?={10,}\n?/)
  let briefIdx = 0
  const summaryParts: string[] = []
  let i = 0

  while (i < segments.length) {
    const seg = segments[i]
    const trimmed = seg.trimStart()
    if (trimmed.startsWith('DEAL BRIEF:') || trimmed.startsWith('INTELLIGENCE BRIEF:')) {
      const summaryText = summaryParts.join('\n').trim()
      if (summaryText) blocks.push({ type: 'summary', text: summaryText })
      summaryParts.length = 0
      const isIntel = trimmed.startsWith('INTELLIGENCE BRIEF:')
      const body    = segments[i + 1] ?? ''
      blocks.push({ type: isIntel ? 'intel' : 'brief', text: `${trimmed}\n${body}`, index: briefIdx++ })
      i += 2
    } else {
      summaryParts.push(seg)
      i++
    }
  }
  const remaining = summaryParts.join('\n').trim()
  if (remaining) blocks.push({ type: 'summary', text: remaining })
  return blocks
}

// ─── Summary / preamble ───────────────────────────────────────────────────────

function SummaryBlock({ text, loading }: { text: string; loading: boolean }) {
  if (!text.trim()) return null
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-6 py-5">
      <Markdown text={text} />
      {loading && <span className="cursor-blink" />}
    </div>
  )
}

function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p:      ({ children }) => <p className="text-sm text-slate-300 leading-relaxed mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="text-slate-100 font-semibold">{children}</strong>,
        em:     ({ children }) => <em className="text-slate-400 italic">{children}</em>,
        h1:     ({ children }) => <h1 className="text-base font-bold text-slate-100 mt-4 mb-2">{children}</h1>,
        h2:     ({ children }) => <h2 className="text-sm font-bold text-slate-200 mt-3 mb-1.5">{children}</h2>,
        h3:     ({ children }) => <h3 className="text-sm font-semibold text-slate-300 mt-2 mb-1">{children}</h3>,
        ul:     ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm text-slate-300">{children}</ul>,
        ol:     ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm text-slate-300">{children}</ol>,
        li:     ({ children }) => <li className="text-slate-300 leading-relaxed">{children}</li>,
        code:   ({ children }) => <code className="text-xs bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{children}</code>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-slate-400 italic">{children}</blockquote>,
        table:  ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-800/60">{children}</thead>,
        th:    ({ children }) => <th className="px-3 py-2 text-left font-semibold text-slate-300 border-b border-slate-700">{children}</th>,
        td:    ({ children }) => <td className="px-3 py-2 text-slate-400 border-b border-slate-800">{children}</td>,
        a:     ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">{children}</a>,
        hr:    () => <hr className="border-slate-800 my-3" />,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

// ─── Deal Brief Card ──────────────────────────────────────────────────────────

const DEAL_SECTIONS: Record<string, { icon: string; color: string }> = {
  'COMPANY OVERVIEW':          { icon: '🏢', color: 'text-sky-400' },
  'DEAL DETAILS':              { icon: '💼', color: 'text-indigo-400' },
  'INVESTORS':                 { icon: '💰', color: 'text-amber-400' },
  'ASSIGNED BANKER':           { icon: '🎯', color: 'text-emerald-400' },
  'SUGGESTED TALKING POINTS':  { icon: '💬', color: 'text-violet-400' },
}

function DealBriefCard({ text, index }: { text: string; index: number }) {
  const lines    = text.split('\n')
  const company  = lines[0].replace('DEAL BRIEF:', '').trim() || `Deal ${index + 1}`
  const sections = parseSections(lines.slice(1), DEAL_SECTIONS)

  return (
    <div className="animate-slide-in rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden shadow-xl">
      <CardHeader emoji="🏢" badge={`Deal Brief #${index + 1}`} title={company} accent="indigo" />
      <SectionList sections={sections} meta={DEAL_SECTIONS} />
    </div>
  )
}

// ─── Intelligence Brief Card ──────────────────────────────────────────────────

const INTEL_SECTIONS: Record<string, { icon: string; color: string }> = {
  'EXECUTIVE PROFILE':          { icon: '👤', color: 'text-violet-300' },
  'LEAD INVESTORS':             { icon: '💰', color: 'text-amber-300' },
  'FUNDING HISTORY':            { icon: '📊', color: 'text-sky-300' },
  'VALUATION ANALYSIS':         { icon: '📈', color: 'text-emerald-300' },
  'CAPITAL NEEDS ASSESSMENT':   { icon: '🎯', color: 'text-rose-300' },
  'OUTREACH STRATEGY':          { icon: '📬', color: 'text-indigo-300' },
}

function IntelligenceBriefCard({ text }: { text: string }) {
  const lines    = text.split('\n')
  const title    = lines[0].replace('INTELLIGENCE BRIEF:', '').trim()
  const sections = parseSections(lines.slice(1), INTEL_SECTIONS)

  return (
    <div className="animate-slide-in rounded-xl border border-violet-700/40 bg-slate-900/70 overflow-hidden shadow-2xl">
      <CardHeader emoji="🔎" badge="Intelligence Brief" title={title} accent="violet" />
      <SectionList sections={sections} meta={INTEL_SECTIONS} />
    </div>
  )
}

// ─── Shared card sub-components ───────────────────────────────────────────────

function CardHeader({ emoji, badge, title, accent }: {
  emoji: string; badge: string; title: string; accent: 'indigo' | 'violet'
}) {
  const bg    = accent === 'indigo' ? 'from-indigo-900/40' : 'from-violet-900/50'
  const border = accent === 'indigo' ? 'border-slate-700/60' : 'border-violet-800/40'
  const iconBg = accent === 'indigo' ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-violet-600/20 border-violet-500/40'
  const badgeColor = accent === 'indigo' ? 'text-indigo-400' : 'text-violet-400'

  return (
    <div className={`flex items-center gap-4 px-6 py-4 bg-gradient-to-r ${bg} to-transparent border-b ${border}`}>
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="min-w-0">
        <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${badgeColor}`}>{badge}</p>
        <h3 className="text-base font-bold text-slate-100 truncate">{title}</h3>
      </div>
    </div>
  )
}

function SectionList({ sections, meta }: {
  sections: Array<{ heading: string; rows: string[] }>
  meta: Record<string, { icon: string; color: string }>
}) {
  if (!sections.length) return null
  return (
    <div className="divide-y divide-slate-800/50">
      {sections.map(({ heading, rows }) => {
        const m = meta[heading] ?? { icon: '📄', color: 'text-slate-400' }
        return (
          <div key={heading} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span>{m.icon}</span>
              <p className={`text-[11px] font-bold uppercase tracking-widest ${m.color}`}>{heading}</p>
            </div>
            <div className="space-y-1.5 pl-6">
              {rows.map((row, i) => <BriefRow key={i} row={row} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BriefRow({ row }: { row: string }) {
  if (!row.trim()) return null

  // Numbered points: "  1. Label: text"
  const numMatch = row.match(/^\s*(\d+)\.\s+(.+?):\s*(.+)$/)
  if (numMatch) {
    return (
      <div className="flex gap-3 items-start">
        <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-bold text-violet-400 flex items-center justify-center mt-0.5">
          {numMatch[1]}
        </span>
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-200">{numMatch[2]}: </span>{numMatch[3]}
        </p>
      </div>
    )
  }

  // Key: value rows: "  CEO: John Smith"
  const kvMatch = row.match(/^\s{0,6}([A-Za-z][A-Za-z ]{1,28}?):\s+(.+)$/)
  if (kvMatch) {
    return (
      <div className="flex gap-3 text-sm">
        <span className="text-slate-500 shrink-0 w-28 text-right">{kvMatch[1]}</span>
        <span className="text-slate-200 flex-1">{kvMatch[2]}</span>
      </div>
    )
  }

  // Plain line
  return <p className="text-sm text-slate-400 leading-relaxed">{row.trim()}</p>
}

// ─── Section parser ───────────────────────────────────────────────────────────

function parseSections(
  lines: string[],
  meta: Record<string, unknown>,
): Array<{ heading: string; rows: string[] }> {
  const sections: Array<{ heading: string; rows: string[] }> = []
  let current: { heading: string; rows: string[] } | null = null

  for (const line of lines) {
    if (/^={5,}/.test(line.trim())) continue
    const trimmed = line.trim()
    if (meta[trimmed]) {
      if (current) sections.push(current)
      current = { heading: trimmed, rows: [] }
    } else if (current && trimmed) {
      current.rows.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}
