const APP_NAME = 'agent_scan_deal'

export async function createSession(userId: string): Promise<string> {
  const res = await fetch(`/apps/${APP_NAME}/users/${userId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Failed to create session: ${res.statusText}`)
  const data = await res.json()
  return data.id as string
}

/** True if a text chunk looks like a brief being echoed by the model */
function isBriefEcho(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('================') ||
         t.startsWith('INTELLIGENCE BRIEF:') ||
         t.startsWith('DEAL BRIEF:')
}

export async function streamRun(
  sessionId: string,
  userId: string,
  message: string,
  onText: (text: string) => void,
  onToolCall: (toolName: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const res = await fetch('/run_sse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: { role: 'user', parts: [{ text: message }] },
      streaming: true,
    }),
  })

  if (!res.ok || !res.body) {
    onError(`Agent request failed: ${res.statusText}`)
    return
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  // Once we've received the formatted brief from functionResponse, suppress
  // any model-text echo of the same content.
  let briefEmitted = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue

      try {
        const event = JSON.parse(raw)
        const parts: unknown[] = event?.content?.parts ?? []

        for (const part of parts as Record<string, unknown>[]) {

          // ── functionResponse ──────────────────────────────────────────────
          if (part.functionResponse && typeof part.functionResponse === 'object') {
            const fr   = part.functionResponse as Record<string, unknown>
            const name = fr.name as string
            // Only surface the two tools that produce user-visible formatted text
            if (name === 'format_intelligence_brief' || name === 'process_deals') {
              const resp   = fr.response as Record<string, unknown>
              const output = resp?.output ?? resp?.result ?? resp?.content
              if (typeof output === 'string' && output.trim()) {
                onText(output)
                briefEmitted = true
              }
            }
            continue // never show raw functionResponse parts as model text
          }

          // ── functionCall ──────────────────────────────────────────────────
          if (part.functionCall && typeof part.functionCall === 'object') {
            const fc = part.functionCall as Record<string, unknown>
            if (typeof fc.name === 'string') onToolCall(fc.name)
            continue
          }

          // ── model text ────────────────────────────────────────────────────
          if (typeof part.text === 'string' && part.text) {
            // Suppress brief echoes when we already have the content from functionResponse
            if (briefEmitted && isBriefEcho(part.text)) continue
            onText(part.text)
          }
        }
      } catch {
        // Non-JSON SSE line — skip
      }
    }
  }

  onDone()
}
