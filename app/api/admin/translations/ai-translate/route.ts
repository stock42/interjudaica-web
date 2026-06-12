import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { defaultTranslations } from '@/models/translations'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'
import { deepseekProvider, deepseek } from '@/lib/ai-provider'
import { TranslationStorage } from '@/services/translations-storage'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	try {
		const { locale, apiKey, model: modelParam } = (await request.json()) as {
			locale: string
			apiKey?: string
			model?: string
		}

		if (!locale || locale === 'en') {
			return NextResponse.json(
				{ error: 'Invalid target locale' },
				{ status: 400 },
			)
		}

		const resolvedKey =
			apiKey || process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY

		if (!resolvedKey) {
			return NextResponse.json(
				{
					error:
						'No AI API key configured. Set DEEPSEEK_API_KEY or AI_API_KEY env var, or pass apiKey in request.',
				},
				{ status: 400 },
			)
		}

		const model = modelParam ? deepseek(modelParam) : deepseekProvider

		const entries = Object.entries(defaultTranslations)
		const batchSize = 30
		const translated: Record<string, string> = {}

		for (let i = 0; i < entries.length; i += batchSize) {
			const batch = entries.slice(i, i + batchSize)
			const prompt = buildPrompt(locale, batch)

			const { text } = await generateText({
				model,
				messages: [
					{
						role: 'system',
						content:
							'You are a professional translator. Translate the provided JSON key/value pairs. Return ONLY a valid JSON object with the same keys and translated values. No markdown, no explanation.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.3,
			})

			try {
				const cleaned = text
					.replace(/```(?:json)?\s*/g, '')
					.replace(/```\s*$/g, '')
					.trim()
				const batchResult = JSON.parse(cleaned) as Record<string, string>
				Object.assign(translated, batchResult)
			} catch {
				return NextResponse.json(
					{
						error: 'AI returned invalid JSON. Try again.',
						raw: text.slice(0, 300),
					},
					{ status: 502 },
				)
			}
		}

		await TranslationStorage.setTranslations(locale, translated)

		return NextResponse.json({ locale, translated })
	} catch (error) {
		return routeError(error)
	}
}

function buildPrompt(
	locale: string,
	entries: Array<[string, string]>,
): string {
	const localeNames: Record<string, string> = {
		es: 'Spanish',
		fr: 'French',
		de: 'German',
		pt: 'Portuguese',
		it: 'Italian',
		he: 'Hebrew',
		ru: 'Russian',
		ar: 'Arabic',
		ja: 'Japanese',
		zh: 'Chinese (Simplified)',
	}
	const langName = localeNames[locale] || locale

	const json = Object.fromEntries(entries)
	return `Translate this JSON to ${langName} (locale: ${locale}). Keys must stay identical. Values should be natural ${langName}. Return ONLY the JSON:\n\n${JSON.stringify(json, null, 2)}`
}
