'use client'

import { useState, useCallback } from 'react'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'

type Locale = 'en' | 'es' | 'he' | 'fr'

export const LOCALES: { code: Locale; flag: string; label: string }[] = [
	{ code: 'en', flag: '🇬🇧', label: 'English' },
	{ code: 'es', flag: '🇪🇸', label: 'Español' },
	{ code: 'he', flag: '🇮🇱', label: 'עברית' },
	{ code: 'fr', flag: '🇫🇷', label: 'Français' },
]

export async function callAiTranslate(locale: Locale): Promise<boolean> {
	try {
		const res = await fetch('/api/admin/translations/ai-translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ locale }),
		})
		return res.ok
	} catch {
		return false
	}
}

export default function TranslateButton() {
	const [currentLocale, setCurrentLocale] = useState<Locale>('en')
	const [isTranslating, setIsTranslating] = useState(false)
	const [open, setOpen] = useState(false)

	const handleSelect = useCallback(async (locale: Locale) => {
		if (locale === currentLocale) {
			setOpen(false)
			return
		}

		setIsTranslating(true)
		setOpen(false)

		try {
			if (locale !== 'en') {
				// Check if translations exist; if not, try AI translate
				const checkRes = await fetch(`/api/translations?locale=${locale}`)
				const checkData = (await checkRes.json()) as {
					hasTranslations?: boolean
				}

				if (!checkData.hasTranslations) {
					await callAiTranslate(locale)
				}
			}

			setCurrentLocale(locale)
			if (typeof document !== 'undefined') {
				document.cookie = `interjudaica_locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
			}
		} catch {
			setCurrentLocale(locale)
		} finally {
			setIsTranslating(false)
		}
	}, [currentLocale])

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						aria-label="Switch language"
						disabled={isTranslating}
						className="flex items-center justify-center size-12 rounded-full border border-[var(--gold)] bg-[var(--paper)] shadow-lg text-xl transition-all duration-200 hover:bg-[rgba(244,189,51,0.12)] hover:scale-110 hover:shadow-[0_0_24px_rgba(244,189,51,0.18)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--paper)] disabled:opacity-50"
					>
						{isTranslating ? (
							<svg
								className="animate-spin size-5 text-[var(--gold)]"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
						) : (
							<span className="text-xl leading-none" aria-hidden="true">
								🌐
							</span>
						)}
					</button>
				</PopoverTrigger>

				<PopoverContent
					align="end"
					side="top"
					sideOffset={8}
					className="w-48"
				>
					<div className="text-xs font-medium text-muted-foreground px-1.5 py-1">
						Select language
					</div>

					{LOCALES.map(({ code, flag, label }) => (
						<button
							key={code}
							type="button"
							onClick={() => handleSelect(code)}
							className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition hover:bg-muted ${
								code === currentLocale
									? 'bg-[rgba(244,189,51,0.12)] text-[var(--gold)] font-semibold'
									: 'text-foreground'
							}`}
						>
							<span className="text-base leading-none" aria-hidden="true">
								{flag}
							</span>
							<span>{label}</span>
							{code === currentLocale && (
								<svg
									className="ml-auto size-4 text-[var(--gold)]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							)}
						</button>
					))}

					{isTranslating && (
						<div className="mt-1 flex items-center gap-2 rounded-md bg-[rgba(244,189,51,0.08)] px-2.5 py-2 text-xs text-muted-foreground">
							<svg
								className="animate-spin size-3 shrink-0 text-[var(--gold)]"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Translating...
						</div>
					)}
				</PopoverContent>
			</Popover>
		</div>
	)
}
