interface Props {
  output: string
  loading: boolean
  error: string | null
}

export function StreamOutput({ output, loading, error }: Props) {
  if (error) {
    return (
      <div className="animate-slide-in rounded-xl bg-red-950/40 border border-red-800/60 p-5 flex gap-3">
        <span className="text-red-400 text-xl shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-red-300 mb-1">Something went wrong</p>
          <p className="text-xs text-red-400/80 font-mono">{error}</p>
        </div>
      </div>
    )
  }

  if (!output && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-700 select-none">
        <div className="text-6xl mb-5 grayscale opacity-40">📊</div>
        <p className="text-sm text-slate-600">Results will appear here</p>
      </div>
    )
  }

  // Split text into a summary preamble + individual deal brief blocks
  const briefs = parseBriefs(output)

  return (
    <div className="space-y-5 animate-slide-in">
      {briefs.map((block, i) =>
        block.type === 'summary' ? (
          <SummaryBlock key={i} text={block.text} loading={loading && i === briefs.length - 1} />
        ) : (
          <DealBriefCard key={i} text={block.text} index={block.index ?? i} />
        ),
      )}
      {/* Trailing cursor while streaming inside an empty brief */}
      {loading && briefs.length === 0 && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-400 step-dot-active" />
          <span>Agent is thinking…</span>
        </div>
      )}
    </div>
  )
}

// ─── Parsers ────────────────────────────────────────────────────────────────

interface Block {
  type: 'summary' | 'brief'
  text: string
  index?: number
}

function parseBriefs(raw: string): Block[] {
  const blocks: Block[] = []
  // Split at each occurrence of the === separator
  const parts = raw.split(/(?=={10,})/)
  let briefIdx = 0

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('===')) {
      blocks.push({ type: 'brief', text: trimmed, index: briefIdx++ })
    } else {
      blocks.push({ type: 'summary', text: trimmed })
    }
  }
  return blocks
}

// ─── Summary (preamble / table) ──────────────────────────────────────────────

function SummaryBlock({ text, loading }: { text: string; loading: boolean }) {
  const lines = text.split('\n')
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        return <TextLine key={i} line={line} />
      })}
      {loading && <span className="cursor-blink" />}
    </div>
  )
}

function TextLine({ line }: { line: string }) {
  // Render **bold** markers without innerHTML
  const parts = line.split(/\*\*(.+?)\*\*/)
  // Detect markdown table rows
  const isTableRow = line.trim().startsWith('|')
  const isTableSep = /^\|[-| :]+\|$/.test(line.trim())

  if (isTableSep) return null

  if (isTableRow) {
    const cells = line.split('|').filter((c) => c.trim())
    return (
      <div className="flex gap-0 text-xs font-mono">
        {cells.map((cell, i) => (
          <span
            key={i}
            className={`flex-1 px-3 py-1.5 border-b border-slate-800 truncate ${
              i === 0 ? 'text-slate-300 font-semibold' : 'text-slate-400'
            }`}
          >
            {cell.trim()}
          </span>
        ))}
      </div>
    )
  }

  return (
    <p className="text-sm text-slate-300 leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-slate-100 font-semibold">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  )
}

// ─── Deal Brief Card ─────────────────────────────────────────────────────────

const SECTION_META: Record<string, { icon: string; color: string }> = {
  'COMPANY OVERVIEW':    { icon: '🏢', color: 'text-sky-400' },
  'DEAL DETAILS':        { icon: '💼', color: 'text-indigo-400' },
  'INVESTORS':           { icon: '💰', color: 'text-amber-400' },
  'ASSIGNED BANKER':     { icon: '🎯', color: 'text-emerald-400' },
  'SUGGESTED TALKING POINTS': { icon: '💬', color: 'text-violet-400' },
}

function DealBriefCard({ text, index }: { text: string; index: number }) {
  const lines = text.split('\n')

  // Extract company name from DEAL BRIEF: line
  const titleLine = lines.find((l) => l.includes('DEAL BRIEF:'))
  const company = titleLine?.replace(/={3,}/g, '').replace('DEAL BRIEF:', '').trim() ?? `Deal ${index + 1}`

  // Parse into labelled sections
  const sections = parseSections(lines)

  return (
    <div className="animate-slide-in rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden shadow-xl">
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-900/40 to-slate-900/0 border-b border-slate-700/60">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <span className="text-xl">🏢</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">
            Deal Brief #{index + 1}
          </p>
          <h3 className="text-base font-bold text-slate-100 truncate">{company}</h3>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-slate-800/60">
        {sections.map(({ heading, rows }) => {
          const meta = SECTION_META[heading] ?? { icon: '📄', color: 'text-slate-400' }
          return (
            <div key={heading} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{meta.icon}</span>
                <p className={`text-[11px] font-bold uppercase tracking-widest ${meta.color}`}>
                  {heading}
                </p>
              </div>
              <div className="space-y-2">
                {rows.map((row, i) => {
                  // Numbered talking points
                  const tpMatch = row.match(/^\s*(\d+)\.\s+(.+?):\s*(.*)$/)
                  if (tpMatch) {
                    return (
                      <div key={i} className="flex gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-bold text-violet-400 flex items-center justify-center mt-0.5">
                          {tpMatch[1]}
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-200">{tpMatch[2]}: </span>
                          {tpMatch[3]}
                        </p>
                      </div>
                    )
                  }
                  // Key: value rows
                  const kvMatch = row.match(/^\s{0,6}([A-Za-z ]+?):\s+(.+)$/)
                  if (kvMatch) {
                    return (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-slate-500 shrink-0 w-28 text-right">{kvMatch[1]}</span>
                        <span className="text-slate-300">{kvMatch[2]}</span>
                      </div>
                    )
                  }
                  // Plain text
                  if (row.trim()) {
                    return <p key={i} className="text-sm text-slate-400 leading-relaxed">{row.trim()}</p>
                  }
                  return null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function parseSections(lines: string[]): Array<{ heading: string; rows: string[] }> {
  const sections: Array<{ heading: string; rows: string[] }> = []
  let current: { heading: string; rows: string[] } | null = null

  for (const line of lines) {
    // Skip separator and title lines
    if (line.match(/^={10,}/) || line.includes('DEAL BRIEF:')) continue
    // Section heading — all-caps line with no leading whitespace content
    const headingMatch = line.match(/^([A-Z][A-Z &]+)$/)
    if (headingMatch && SECTION_META[headingMatch[1].trim()]) {
      if (current) sections.push(current)
      current = { heading: headingMatch[1].trim(), rows: [] }
      continue
    }
    if (current && line.trim()) current.rows.push(line)
  }
  if (current) sections.push(current)
  return sections
}
