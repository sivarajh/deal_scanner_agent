import { useRef, useState } from 'react'
import { createSession, streamRun } from '../api/adkClient'
import { SCAN_PIPELINE_STEPS, RESEARCH_PIPELINE_STEPS, type AppMode, type Step } from '../types'

const USER_ID = 'banker-1'

// Deal scanner: one tool call = one step
const SCAN_TOOL_TO_STEP: Record<string, string> = {
  load_deals:    'load',
  filter_deals:  'filter',
  get_bankers:   'bankers',
  process_deals: 'process',
}

// Research: google_search fires 2-3 times; map call count → step
// call 1 → profile, call 2 → funding, call 3 → valuation+needs
const RESEARCH_SEARCH_STEP_SEQUENCE = ['profile', 'funding', 'valuation', 'needs']

function initSteps(mode: AppMode): Step[] {
  const defs = mode === 'scan' ? SCAN_PIPELINE_STEPS : RESEARCH_PIPELINE_STEPS
  return defs.map((s) => ({ ...s, status: 'pending' }))
}

export function useAgentStream(mode: AppMode) {
  const [output,  setOutput]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [steps,   setSteps]   = useState<Step[]>(initSteps(mode))

  const sessionIdRef        = useRef<string | null>(null)
  const doneStepsRef        = useRef<Set<string>>(new Set())
  const searchCallCountRef  = useRef(0)

  function activateStep(id: string) {
    if (doneStepsRef.current.has(id)) return
    doneStepsRef.current.add(id)

    setSteps((prev) => {
      const targetIdx = prev.findIndex((s) => s.id === id)
      if (targetIdx === -1) return prev
      return prev.map((s, i) => {
        if (i < targetIdx) return { ...s, status: 'done' }
        if (i === targetIdx) return { ...s, status: 'active' }
        return s
      })
    })
  }

  function completeAllSteps() {
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
  }

  function handleToolCall(toolName: string) {
    if (mode === 'scan') {
      const stepId = SCAN_TOOL_TO_STEP[toolName]
      if (stepId) activateStep(stepId)
    } else {
      if (toolName === 'web_search_agent') {
        const stepId = RESEARCH_SEARCH_STEP_SEQUENCE[searchCallCountRef.current]
        searchCallCountRef.current += 1
        if (stepId) activateStep(stepId)
      } else if (toolName === 'format_intelligence_brief') {
        activateStep('brief')
      }
    }
  }

  async function submit(query: string) {
    setOutput('')
    setError(null)
    setLoading(true)
    setSteps(initSteps(mode))
    doneStepsRef.current      = new Set()
    searchCallCountRef.current = 0

    try {
      if (!sessionIdRef.current) {
        sessionIdRef.current = await createSession(USER_ID)
      }

      await streamRun(
        sessionIdRef.current,
        USER_ID,
        query,
        (text)     => setOutput((prev) => prev + text),
        (toolName) => handleToolCall(toolName),
        ()         => { completeAllSteps(); setLoading(false) },
        (err)      => { setError(err);      setLoading(false) },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  function reset() {
    setOutput('')
    setError(null)
    setSteps(initSteps(mode))
    doneStepsRef.current       = new Set()
    searchCallCountRef.current = 0
    sessionIdRef.current       = null
  }

  return { output, loading, error, steps, submit, reset }
}
