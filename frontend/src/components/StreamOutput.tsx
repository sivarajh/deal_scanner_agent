interface Props {
  output: string
  loading: boolean
  error: string | null
}

export function StreamOutput({ output, loading, error }: Props) {
  if (error) {
    return (
      <div className="rounded-lg bg-red-950/50 border border-red-800 p-4 text-red-300 text-sm">
        <span className="font-semibold">Error: </span>{error}
      </div>
    )
  }

  if (!output && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-sm">Select a vertical and deal size, then click Scan Deals</p>
      </div>
    )
  }

  // Split output into sections — deal briefs are separated by ===...=== lines
  const sections = output.split(/(?=={10,})/).filter(Boolean)

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const isBrief = section.trim().startsWith('===')
        return isBrief ? (
          <DealBriefBlock key={i} text={section} />
        ) : (
          <SummaryBlock key={i} text={section} />
        )
      })}
      {loading && <span className="cursor-blink text-indigo-400" />}
    </div>
  )
}

function SummaryBlock({ text }: { text: string }) {
  if (!text.trim()) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        // Render **bold** as strong without innerHTML — parse manually
        return <TextLine key={i} line={line} />
      })}
    </div>
  )
}

function TextLine({ line }: { line: string }) {
  // Split on **...** markers and render spans
  const parts = line.split(/\*\*(.+?)\*\*/)
  return (
    <p className="text-slate-300 leading-relaxed text-sm">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-slate-100 font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  )
}

function DealBriefBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  const titleLine = lines.find((l) => l.startsWith('DEAL BRIEF:'))
  const title = titleLine?.replace('DEAL BRIEF:', '').replace(/=/g, '').trim() ?? 'Deal Brief'

  const body = lines
    .filter((l) => !l.match(/^={10,}/) && !l.startsWith('DEAL BRIEF:'))
    .join('\n')
    .trim()

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-indigo-900/30 border-b border-slate-700">
        <span className="text-indigo-400 text-lg">🏢</span>
        <h3 className="font-semibold text-indigo-200 text-sm tracking-wide">{title}</h3>
      </div>
      {/* Body — monospace for alignment */}
      <pre className="px-5 py-4 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {body}
      </pre>
    </div>
  )
}
