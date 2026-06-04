import 'server-only'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL =
	process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'

function getHeaders() {
	if (!DEEPSEEK_API_KEY) {
		throw new Error('DEEPSEEK_API_KEY is not set')
	}
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
	}
}

export async function generateQuery(promoting: string): Promise<string> {
	const systemPrompt = `You are a MongoDB query generator. Given a natural language description of contacts to target, generate a valid MongoDB query filter as a JSON object.

Rules:
- The collection is "crm_contacts" with document shape: { uuid, data: { firstname, lastname, email, notes, tags: string[] } }
- Tags are UUID strings pointing to "crm_tags" collection.
- Return ONLY the filter object as JSON, no explanation, no markdown.
- Use proper MongoDB query syntax: $text, $in, $regex, $exists, $gt, $lt, etc.
- Example: to find contacts named "John" → { "data.firstname": "John" }
- Example: to find contacts with tag "vip" → use the tag name text match { "data.tags": { "$in": ["<tag-uuid>"] } } but since you don't know UUIDs, use a $text search on name instead.
- If the description is vague, return an empty object {}.`

	const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: promoting },
			],
			temperature: 0.1,
			max_tokens: 2000,
		}),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`DeepSeek API error: ${response.status} ${text}`)
	}

	const data = await response.json()
	const content = data.choices?.[0]?.message?.content?.trim() ?? '{}'

	// Extract JSON from possible markdown code blocks
	const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
	const jsonStr = jsonMatch ? jsonMatch[1].trim() : content

	// Validate it's valid JSON
	try {
		JSON.parse(jsonStr)
	} catch {
		throw new Error(`DeepSeek returned invalid JSON: ${jsonStr.slice(0, 200)}`)
	}

	return jsonStr
}

export async function generateTemplateHtml(
	promoting: string,
	subject: string,
): Promise<string> {
	const systemPrompt = `You are an email HTML generator for a Jewish learning institute called InterJudaica. Given a description/prompt, generate beautiful, responsive HTML email content.

Rules:
- Generate ONLY the body HTML (no <html>, <head>, <body> tags).
- Use inline CSS styles for email compatibility.
- Keep it professional, warm, and aligned with a Torah/Jewish education brand.
- Use a max-width of 600px centered container.
- Available metavariables: {{firstname}}, {{lastname}}, {{email}}
- Use {{firstname}} in the greeting.
- The email subject line (provided separately) is: "${subject}"
- Include a footer with "InterJudaica - Jewish Learning Institute" and a note that this is an automated message.
- Keep it under 3000 characters of HTML.
- Do NOT include any explanation, just the HTML.`

	const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({
			model: 'deepseek-chat',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: promoting },
			],
			temperature: 0.7,
			max_tokens: 4000,
		}),
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`DeepSeek API error: ${response.status} ${text}`)
	}

	const data = await response.json()
	const content = data.choices?.[0]?.message?.content?.trim() ?? ''

	// Strip markdown code fences if present
	const htmlMatch = content.match(/```html\s*\n?([\s\S]*?)\n?```/)
	if (htmlMatch) return htmlMatch[1].trim()

	return content
}
