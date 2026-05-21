import { useRef, useState } from 'react'
import { createSession, streamRun } from '../api/adkClient'
import { PIPELINE_STEPS, type Step } from '../types'

const USER_ID = 'banker-1'

/** Map ADK tool function names → pipeline step IDs */
const TOOL_TO_STEP: Record<string, string> = {
  load_deals:    'load',
  filter_deals:  'filter',
  get_bankers:   'bankers',
  match_banker:  'match',
  generate_brief: 'brief',
}

function initSteps(): Step[] {
  return PIPELINE_STEPS.map((s) => ({ ...s, status: 'pending' }))
}

export function useAgentStream() {
  const [output,  setOutput]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [steps,   setSteps]   = useState<Step[]>(initSteps())

  const sessionIdRef  = useRef<string | null>(null)
  const doneStepsRef  = useRef<Set<string>>(new Set())

  /** Advance the tracker: mark this step active, all prior steps done */
  function activateStep(id: string) {
    if (doneStepsRef.current.has(id)) return  // already processed
    doneStepsRef.current.add(id)

    setSteps((prev) => {
      const targetIdx = prev.findIndex((s) => s.id === id)
      return prev.map((s, i) => {
        if (i < targetIdx) return { ...s, status: 'done' }
        if (i === targetIdx) return { ...s, status: 'active' }
        return s  // keep pending
      })
    })
  }

  function completeAllSteps() {
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
  }

  async function submit(query: string) {
    setOutput('')
    setError(null)
    setLoading(true)
    setSteps(initSteps())
    doneStepsRef.current = new Set()

    try {
      if (!sessionIdRef.current) {
        sessionIdRef.current = await createSession(USER_ID)
      }

      await streamRun(
        sessionIdRef.current,
        USER_ID,
        query,
        // onText — append model text directly to output
        (text) => setOutput((prev) => prev + text),
        // onToolCall — advance pipeline step based on which tool was called
        (toolName) => {
          const stepId = TOOL_TO_STEP[toolName]
          if (stepId) activateStep(stepId)
        },
        // onDone
        () => {
          completeAllSteps()
          setLoading(false)
        },
        // onError
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
    doneStepsRef.current = new Set()
    sessionIdRef.current = null
  }

  return { output, loading, error, steps, submit, reset }
}
