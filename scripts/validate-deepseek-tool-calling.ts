/**
 * DeepSeek R1 Tool Calling Validation Spike
 *
 * Tests DeepSeek R1 (deepseek-reasoner) API compatibility with:
 * 1. Non-streaming tool calling (OpenAI-compatible tool_calls)
 * 2. Streaming SSE chunks with tool_calls delta events
 * 3. R1 dual-token behavior: reasoning_content before content in streams
 *
 * Usage: bun run scripts/validate-deepseek-tool-calling.ts
 * Output: scripts/validation-results.json
 */

const API_KEY = process.env.DEEPSEEK_API_KEY
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const MODEL = 'deepseek-reasoner'
const RESULTS_PATH = new URL('validation-results.json', import.meta.url).pathname

interface ValidationResults {
	tool_calling_supported: boolean
	streaming_supported: boolean
	reasoning_tokens_observed: boolean
	raw_test1_summary: string
	raw_test2_summary: string
	raw_test3_summary: string
	timestamp: string
}

const results: ValidationResults = {
	tool_calling_supported: false,
	streaming_supported: false,
	reasoning_tokens_observed: false,
	raw_test1_summary: '',
	raw_test2_summary: '',
	raw_test3_summary: '',
	timestamp: new Date().toISOString(),
}

function getHeaders(): Record<string, string> {
	if (!API_KEY) {
		throw new Error('DEEPSEEK_API_KEY is not set')
	}
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${API_KEY}`,
	}
}

const TOOL_DEFINITION = {
	type: 'function' as const,
	function: {
		name: 'getCurrentTime',
		description: 'Get the current time as an ISO 8601 string. Call this when asked for the current time.',
		parameters: { type: 'object' as const, properties: {} },
	},
}

const TOOL_SYSTEM_PROMPT =
	'You are a helpful assistant. When the user asks a question that requires knowing the current time, you MUST call the getCurrentTime function. Do not answer without calling the function.'

const TOOL_USER_PROMPT = 'What time is it right now?'

const REASONING_SYSTEM_PROMPT =
	'You are a careful mathematician. Think step by step before answering.'

const REASONING_USER_PROMPT =
	'How many ways can you arrange 5 distinct books on a shelf? Show your reasoning.'

async function request(
	stream: boolean,
	extraOptions: Record<string, unknown> = {},
) {
	const headers = getHeaders()
	const body = JSON.stringify({
		model: MODEL,
		messages: [
			{ role: 'system', content: TOOL_SYSTEM_PROMPT },
			{ role: 'user', content: TOOL_USER_PROMPT },
		],
		tools: [TOOL_DEFINITION],
		tool_choice: 'auto',
		stream,
		max_tokens: 2000,
		...extraOptions,
	})

	return fetch(`${BASE_URL}/chat/completions`, {
		method: 'POST',
		headers,
		body,
	})
}

async function requestReasoning(stream: boolean) {
	const headers = getHeaders()
	const body = JSON.stringify({
		model: MODEL,
		messages: [
			{ role: 'system', content: REASONING_SYSTEM_PROMPT },
			{ role: 'user', content: REASONING_USER_PROMPT },
		],
		stream,
		max_tokens: 2000,
	})

	return fetch(`${BASE_URL}/chat/completions`, {
		method: 'POST',
		headers,
		body,
	})
}

async function test1(): Promise<void> {
	console.log('\n--- Test 1: Non-streaming Tool Calling ---')

	try {
		const response = await request(false)
		const status = response.status

		if (status !== 200) {
			const errorText = await response.text()
			results.raw_test1_summary = `HTTP ${status}: ${errorText.slice(0, 300)}`
			console.log(`  FAIL: ${results.raw_test1_summary}`)
			return
		}

		const json = await response.json()
		const choice = json.choices?.[0]
		const message = choice?.message
		const toolCalls = message?.tool_calls

		if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
			results.tool_calling_supported = true
			results.raw_test1_summary = `PASS: Received ${toolCalls.length} tool call(s). First: ${toolCalls[0].function?.name}`
			console.log(`  ${results.raw_test1_summary}`)
		} else if (choice?.finish_reason === 'tool_calls' && !toolCalls) {
			results.raw_test1_summary =
				'PARTIAL: finish_reason=tool_calls but no tool_calls array in message'
			console.log(`  ${results.raw_test1_summary}`)
		} else {
			results.raw_test1_summary = `FAIL: No tool_calls in response. finish_reason=${choice?.finish_reason}, has_content=${!!message?.content}`
			console.log(`  ${results.raw_test1_summary}`)
		}
	} catch (err) {
		results.raw_test1_summary = `ERROR: ${err instanceof Error ? err.message : String(err)}`
		console.log(`  ${results.raw_test1_summary}`)
	}
}

interface SSEDelta {
	role?: string
	content?: string | null
	reasoning_content?: string
	tool_calls?: Array<{
		index?: number
		id?: string
		type?: string
		function?: { name?: string; arguments?: string }
	}>
}

interface SSEChoice {
	index?: number
	delta?: SSEDelta
	finish_reason?: string | null
}

interface SSEChunk {
	id?: string
	choices?: SSEChoice[]
}

/** Parse SSE chunks from a streaming response body. */
async function parseSSEStream(
	response: Response,
): Promise<{ chunks: SSEChunk[]; reasoningChunks: number; contentChunks: number }> {
	const reader = response.body?.getReader()
	if (!reader) throw new Error('No readable stream in response body')

	const decoder = new TextDecoder()
	let buffer = ''
	const chunks: SSEChunk[] = []
	let reasoningChunks = 0
	let contentChunks = 0
	let seenReasoningEnd = false
	let seenContentStart = false

	while (true) {
		const { done, value } = await reader.read()
		if (done) break

		buffer += decoder.decode(value, { stream: true })

		// Process complete lines
		const lines = buffer.split('\n')
		// Last line may be incomplete — keep it in buffer
		buffer = lines.pop() || ''

		for (const line of lines) {
			if (!line.startsWith('data: ')) continue
			const data = line.slice(6).trim()
			if (data === '[DONE]') continue

			try {
				const chunk: SSEChunk = JSON.parse(data)
				chunks.push(chunk)

				for (const choice of chunk.choices || []) {
					const delta = choice.delta || {}

					// Track R1 dual-token behavior
					if (delta.reasoning_content) {
						reasoningChunks++
						// reasoning should appear BEFORE content
						if (seenContentStart) {
							console.log(
								`  WARN: reasoning_content after content in chunk ${chunks.length}`,
							)
						}
					} else if (
						delta.reasoning_content === undefined &&
						delta.content !== undefined &&
						delta.content !== null
					) {
						if (!seenContentStart) {
							seenContentStart = true
							seenReasoningEnd = reasoningChunks > 0
						}
						contentChunks++
					}
				}
			} catch {
				// Skip unparseable data lines
			}
		}
	}

	// Flush remaining buffer
	if (buffer.startsWith('data: ') && buffer.slice(6).trim() !== '[DONE]') {
		try {
			const chunk: SSEChunk = JSON.parse(buffer.slice(6).trim())
			chunks.push(chunk)
		} catch {
			// skip
		}
	}

	return { chunks, reasoningChunks, contentChunks }
}

/** Check if any SSE chunk contains a tool_calls delta. */
function hasToolCallDelta(chunks: SSEChunk[]): boolean {
	for (const chunk of chunks) {
		for (const choice of chunk.choices || []) {
			const toolCalls = choice.delta?.tool_calls
			if (toolCalls && toolCalls.length > 0) return true
		}
	}
	return false
}

async function test2(): Promise<void> {
	console.log('\n--- Test 2: Streaming Tool Calling ---')

	try {
		const response = await request(true)

		if (response.status !== 200) {
			const errorText = await response.text()
			results.raw_test2_summary = `HTTP ${response.status}: ${errorText.slice(0, 300)}`
			console.log(`  FAIL: ${results.raw_test2_summary}`)
			return
		}

		const { chunks, reasoningChunks, contentChunks } =
			await parseSSEStream(response)
		const toolCallFound = hasToolCallDelta(chunks)

		if (toolCallFound) {
			results.streaming_supported = true
			results.raw_test2_summary = `PASS: tool_calls delta found in SSE stream. Total chunks: ${chunks.length}, tool_call chunks: present`
			console.log(`  ${results.raw_test2_summary}`)
		} else {
			results.raw_test2_summary = `FAIL: No tool_calls delta in ${chunks.length} SSE chunks. Reasoning chunks: ${reasoningChunks}, Content chunks: ${contentChunks}`
			console.log(`  ${results.raw_test2_summary}`)
		}

		// Also report reasoning/content from test2 for completeness
		if (reasoningChunks > 0) {
			console.log(
				`  INFO: R1 reasoning tokens observed: ${reasoningChunks} reasoning chunks before content`,
			)
		}
	} catch (err) {
		results.raw_test2_summary = `ERROR: ${err instanceof Error ? err.message : String(err)}`
		console.log(`  ${results.raw_test2_summary}`)
	}
}

async function test3(): Promise<void> {
	console.log('\n--- Test 3: R1 Dual-Token (reasoning_content) ---')

	try {
		const response = await requestReasoning(true)

		if (response.status !== 200) {
			const errorText = await response.text()
			results.raw_test3_summary = `HTTP ${response.status}: ${errorText.slice(0, 300)}`
			console.log(`  FAIL: ${results.raw_test3_summary}`)
			return
		}

		const { chunks, reasoningChunks, contentChunks } =
			await parseSSEStream(response)

		results.raw_test3_summary = `Chunks: ${chunks.length}, Reasoning: ${reasoningChunks}, Content: ${contentChunks}`

		if (reasoningChunks > 0 && contentChunks > 0) {
			results.reasoning_tokens_observed = true
			console.log(
				`  PASS: ${reasoningChunks} reasoning chunks, ${contentChunks} content chunks. R1 dual-token stream confirmed.`,
			)
		} else if (reasoningChunks > 0) {
			results.reasoning_tokens_observed = true
			console.log(
				`  PASS: ${reasoningChunks} reasoning chunks observed (no content chunks — model may have answered with reasoning only)`,
			)
		} else {
			console.log(
				`  INFO: No reasoning_content chunks. Model may have returned only content tokens.`,
			)
		}
	} catch (err) {
		results.raw_test3_summary = `ERROR: ${err instanceof Error ? err.message : String(err)}`
		console.log(`  ${results.raw_test3_summary}`)
	}
}

async function main(): Promise<void> {
	console.log('DeepSeek R1 Tool Calling Validation Spike')
	console.log(`Model: ${MODEL}`)
	console.log(`Base URL: ${BASE_URL}`)

	if (!API_KEY) {
		console.error('\nERROR: DEEPSEEK_API_KEY environment variable is not set.')
		console.error('Set it and re-run:')
		console.error('  export DEEPSEEK_API_KEY=sk-...')
		console.error('  bun run scripts/validate-deepseek-tool-calling.ts')
		// Still write results with the failure info
		results.raw_test1_summary = 'SKIPPED: DEEPSEEK_API_KEY not set'
		results.raw_test2_summary = 'SKIPPED: DEEPSEEK_API_KEY not set'
		results.raw_test3_summary = 'SKIPPED: DEEPSEEK_API_KEY not set'
		await Bun.write(RESULTS_PATH, JSON.stringify(results, null, 2))
		console.log(`\nResults written to ${RESULTS_PATH}`)
		process.exit(1)
	}

	await test1()
	await test2()
	await test3()

	console.log('\n--- Summary ---')
	console.log(`Tool calling supported: ${results.tool_calling_supported}`)
	console.log(`Streaming supported:   ${results.streaming_supported}`)
	console.log(`Reasoning tokens:      ${results.reasoning_tokens_observed}`)

	await Bun.write(RESULTS_PATH, JSON.stringify(results, null, 2))
	console.log(`\nResults written to ${RESULTS_PATH}`)

	const allPassed =
		results.tool_calling_supported &&
		results.streaming_supported &&
		results.reasoning_tokens_observed

	if (allPassed) {
		console.log('\n✅ All tests passed.')
		process.exit(0)
	} else {
		console.log('\n❌ Some tests did not pass. See results above.')
		process.exit(1)
	}
}

main()
