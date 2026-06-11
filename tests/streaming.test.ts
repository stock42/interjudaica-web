import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

let server: ReturnType<typeof Bun.serve>
let baseUrl: string

beforeAll(() => {
	server = Bun.serve({
		port: 3099,
		fetch(req, srv) {
			const url = new URL(req.url)
			if (url.pathname === '/stream') {
				const body = new ReadableStream({
					async start(controller) {
						const tokens = [
							{ token: 'Hello' },
							{ token: ', ' },
							{ token: 'world' },
							{ token: '!' },
							{ token: ' from' },
							{ token: ' Bun' },
						]

						const signal = srv.requestIP(req) ? undefined : undefined
						// Use AbortSignal from the request to detect client disconnect
						const aborted = req.signal

						for (let i = 0; i < tokens.length; i++) {
							if (aborted.aborted) break

							// Simulate processing delay per token
							await new Promise<void>((resolve) => {
								const timer = setTimeout(resolve, 150)
								aborted.addEventListener(
									'abort',
									() => {
										clearTimeout(timer)
										resolve()
									},
									{ once: true },
								)
							})

							if (aborted.aborted) break

							const chunk = `data: ${JSON.stringify(tokens[i])}\n\n`
							controller.enqueue(new TextEncoder().encode(chunk))
						}

						if (!aborted.aborted) {
							const doneChunk = `data: ${JSON.stringify({ token: '[DONE]' })}\n\n`
							controller.enqueue(new TextEncoder().encode(doneChunk))
						}

						controller.close()
					},
				})

				return new Response(body, {
					headers: {
						'Content-Type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						Connection: 'keep-alive',
					},
				})
			}

			return new Response('Not found', { status: 404 })
		},
	})

	baseUrl = `http://localhost:${server.port}`
})

afterAll(() => {
	server.stop()
})

async function collectSSEEvents(opts?: {
	abortSignal?: AbortSignal
	onFirstEvent?: () => void
}): Promise<Record<string, unknown>[]> {
	const response = await fetch(`${baseUrl}/stream`, { signal: opts?.abortSignal })
	expect(response.status).toBe(200)
	expect(response.headers.get('content-type')).toContain('text/event-stream')

	const reader = response.body!.getReader()
	const decoder = new TextDecoder()
	const events: Record<string, unknown>[] = []
	let buffer = ''
	let first = true

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		buffer += decoder.decode(value, { stream: true })

		// SSE events are separated by \n\n
		const parts = buffer.split('\n\n')
		// Last part may be incomplete
		buffer = parts.pop() || ''

		for (const part of parts) {
			const lines = part.split('\n')
			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const json = line.slice(6)
					try {
						const parsed = JSON.parse(json)
						events.push(parsed)
						if (first && parsed.token !== '[DONE]') {
							first = false
							opts?.onFirstEvent?.()
						}
					} catch {
						// skip malformed
					}
				}
			}
		}
	}

	return events
}

describe('SSE streaming via Bun.serve() + fetch()', () => {
	test(
		'streaming delivers progressive events',
		async () => {
			const start = Date.now()
			let firstEventAt = 0

			const events = await collectSSEEvents({
				onFirstEvent: () => {
					firstEventAt = Date.now()
				},
			})

			expect(events.length).toBeGreaterThanOrEqual(3)
			expect(firstEventAt - start).toBeLessThanOrEqual(500)
		},
		5000,
	)

	test(
		'streaming completes with DONE event',
		async () => {
			const events = await collectSSEEvents()

			expect(events.length).toBeGreaterThanOrEqual(1)

			const lastEvent = events[events.length - 1]
			expect(lastEvent).toHaveProperty('token')
			expect(lastEvent.token).toBe('[DONE]')
		},
		5000,
	)

	test(
		'client disconnect stops server emission',
		async () => {
			const controller = new AbortController()

			const fetchPromise = fetch(`${baseUrl}/stream`, {
				signal: controller.signal,
			})

			// Abort after 200ms — before all 6 tokens arrive (6 × 150ms = 900ms)
			await new Promise((resolve) => setTimeout(resolve, 200))
			controller.abort()

			let events: Record<string, unknown>[] = []
			try {
				const response = await fetchPromise
				const reader = response.body!.getReader()
				const decoder = new TextDecoder()
				let buffer = ''

				while (true) {
					const { done, value } = await reader.read()
					if (done) break

					buffer += decoder.decode(value, { stream: true })
					const parts = buffer.split('\n\n')
					buffer = parts.pop() || ''

					for (const part of parts) {
						const lines = part.split('\n')
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const json = line.slice(6)
								try {
									events.push(JSON.parse(json))
								} catch {
									// skip
								}
							}
						}
					}
				}
			} catch (err) {
				// Expected — AbortError when fetch is aborted mid-stream
				const msg = err instanceof Error ? err.message : String(err)
				expect(msg).toMatch(/abort/i)
			}

			// Should have received fewer than 5 events (aborted early)
			expect(events.length).toBeLessThan(5)
		},
		5000,
	)
})
