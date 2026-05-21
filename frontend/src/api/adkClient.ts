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

export async function streamRun(
  sessionId: string,
  userId: string,
  message: string,
  onChunk: (text: string) => void,
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
      new_message: {
        role: 'user',
        parts: [{ text: message }],
      },
      streaming: true,
    }),
  })

  if (!res.ok || !res.body) {
    onError(`Agent request failed: ${res.statusText}`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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
        // Extract text from content parts
        const parts = event?.content?.parts ?? []
        for (const part of parts) {
          if (typeof part.text === 'string' && part.text) {
            onChunk(part.text)
          }
        }
      } catch {
        // Non-JSON line — skip
      }
    }
  }

  onDone()
}
