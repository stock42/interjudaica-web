import { NextResponse, type NextRequest } from "next/server";
import { defaultTranslations } from "@/models/translations";
import { requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) return auth.response;

	try {
		const { locale, apiKey, model } = await request.json() as {
			locale: string;
			apiKey?: string;
			model?: string;
		};

		if (!locale || locale === "en") {
			return NextResponse.json({ error: "Invalid target locale" }, { status: 400 });
		}

		const resolvedKey = apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
		const resolvedModel = model || process.env.AI_MODEL || "gpt-4o-mini";

		if (!resolvedKey) {
			return NextResponse.json(
				{ error: "No AI API key configured. Set OPENAI_API_KEY or AI_API_KEY env var, or pass apiKey in request." },
				{ status: 400 },
			);
		}

		const entries = Object.entries(defaultTranslations);
		const batchSize = 30;
		const translated: Record<string, string> = {};

		for (let i = 0; i < entries.length; i += batchSize) {
			const batch = entries.slice(i, i + batchSize);
			const prompt = buildPrompt(locale, batch);

			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${resolvedKey}`,
				},
				body: JSON.stringify({
					model: resolvedModel,
					messages: [
						{
							role: "system",
							content: "You are a professional translator. Translate the provided JSON key/value pairs. Return ONLY a valid JSON object with the same keys and translated values. No markdown, no explanation.",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					temperature: 0.3,
				}),
			});

			if (!response.ok) {
				const err = await response.text();
				return NextResponse.json(
					{ error: `AI API error: ${response.status} ${err.slice(0, 200)}` },
					{ status: 502 },
				);
			}

			const data = await response.json() as {
				choices: Array<{ message: { content: string } }>;
			};

			try {
				const text = data.choices?.[0]?.message?.content ?? "";
				const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
				const batchResult = JSON.parse(cleaned) as Record<string, string>;
				Object.assign(translated, batchResult);
			} catch {
				return NextResponse.json(
					{ error: "AI returned invalid JSON. Try again.", raw: data.choices?.[0]?.message?.content?.slice(0, 300) },
					{ status: 502 },
				);
			}
		}

		return NextResponse.json({ locale, translated });
	} catch (error) {
		return routeError(error);
	}
}

function buildPrompt(locale: string, entries: Array<[string, string]>): string {
	const localeNames: Record<string, string> = {
		es: "Spanish",
		fr: "French",
		de: "German",
		pt: "Portuguese",
		it: "Italian",
		he: "Hebrew",
		ru: "Russian",
		ar: "Arabic",
		ja: "Japanese",
		zh: "Chinese (Simplified)",
	};
	const langName = localeNames[locale] || locale;

	const json = Object.fromEntries(entries);
	return `Translate this JSON to ${langName} (locale: ${locale}). Keys must stay identical. Values should be natural ${langName}. Return ONLY the JSON:\n\n${JSON.stringify(json, null, 2)}`;
}
