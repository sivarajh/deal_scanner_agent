import { useRef, useState } from 'react'
import { createSession, streamRun } from '../api/adkClient'

const USER_ID = 'banker-1'

export function useAgentStream() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  async function submit(query: string) {
    setOutput('')
    setError(null)
    setLoading(true)

    try {
      // Reuse session across queries, create once
      if (!sessionIdRef.current) {
        sessionIdRef.current = await createSession(USER_ID)
      }

      await streamRun(
        sessionIdRef.current,
        USER_ID,
        query,
        (chunk) => setOutput((prev) => prev + chunk),
        () => setLoading(false),
        (err) => {
          setError(err)
          setLoading(false)
        },
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setLoading(false)
    }
  }

  function reset() {
    setOutput('')
    setError(null)
    sessionIdRef.current = null
  }

  return { output, loading, error, submit, reset }
}
