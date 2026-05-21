import { useRef, useState } from 'react'
import { createSession, streamRun } from '../api/adkClient'
import { PIPELINE_STEPS, type Step } from '../types'

const USER_ID = 'banker-1'

function initSteps(): Step[] {
  return PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' }))
}

/** Detect which pipeline step a chunk of text corresponds to */
function detectStep(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('load_deals'))         return 'load'
  if (t.includes('filter_deals'))       return 'filter'
  if (t.includes('get_bankers'))        return 'bankers'
  if (t.includes('match_banker'))       return 'match'
  if (t.includes('generate_brief'))     return 'brief'
  return null
}

export function useAgentStream() {
  const [output,  setOutput]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [steps,   setSteps]   = useState<Step[]>(initSteps())

  const sessionIdRef   = useRef<string | null>(null)
  const activeStepRef  = useRef<string | null>(null)

  function markStep(id: string) {
    if (activeStepRef.current === id) return
    activeStepRef.current = id
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id)                                   return { ...s, status: 'active' }
        // mark all earlier steps done
        const idx      = prev.findIndex((x) => x.id === id)
        const sIdx     = prev.findIndex((x) => x.id === s.id)
        if (sIdx < idx && s.status !== 'done')            return { ...s, status: 'done' }
        return s
      }),
    )
  }

  function completeSteps() {
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
  }

  async function submit(query: string) {
    setOutput('')
    setError(null)
    setLoading(true)
    setSteps(initSteps())
    activeStepRef.current = null

    // Auto-activate first step immediately so progress is visible
    markStep('load')

    try {
      if (!sessionIdRef.current) {
        sessionIdRef.current = await createSession(USER_ID)
      }

      await streamRun(
        sessionIdRef.current,
        USER_ID,
        query,
        (chunk) => {
          // Detect tool calls to advance the progress tracker
          const stepId = detectStep(chunk)
          if (stepId) markStep(stepId)
          // Only append model text (not tool call JSON noise)
          if (!chunk.startsWith('{"')) {
            setOutput((prev) => prev + chunk)
          }
        },
        () => {
          completeSteps()
          setLoading(false)
        },
        (err) => {
          setError(err)
          setLoading(false)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  function reset() {
    setOutput('')
    setError(null)
    setSteps(initSteps())
    sessionIdRef.current  = null
    activeStepRef.current = null
  }

  return { output, loading, error, steps, submit, reset }
}
