import { NextResponse, type NextRequest } from 'next/server'
import { TranslationStorage } from '@/services/translations-storage'
import { defaultTranslations } from '@/models/translations'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url)
		const locale = url.searchParams.get('locale') ?? 'en'

		if (locale === 'en') {
			return NextResponse.json({
				locale: 'en',
				dictionary: defaultTranslations,
				hasTranslations: true,
			})
		}

		const dict = await TranslationStorage.getAll(locale)

		const translatedKeys = Object.keys(dict).filter(
			(k) => !(k in defaultTranslations) || dict[k] !== defaultTranslations[k],
		)
		const hasTranslations = translatedKeys.length > 0

		return NextResponse.json({
			locale,
			dictionary: dict,
			hasTranslations,
		})
	} catch {
		return NextResponse.json(
			{ error: 'Failed to load translations' },
			{ status: 500 },
		)
	}
}
