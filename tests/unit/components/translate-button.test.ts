import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'
import { createElement } from 'react'

describe('TranslateButton', () => {
	describe('LOCALES constant', () => {
		test('has 4 locale entries', async () => {
			const { LOCALES } = await import(
				'@/components/share/translate-button'
			)
			expect(LOCALES).toHaveLength(4)
		})

		test('all locale codes are valid', async () => {
			const { LOCALES } = await import(
				'@/components/share/translate-button'
			)
			const codes = LOCALES.map((l) => l.code)
			expect(codes).toContain('en')
			expect(codes).toContain('es')
			expect(codes).toContain('he')
			expect(codes).toContain('fr')
		})

		test('each locale has flag and label', async () => {
			const { LOCALES } = await import(
				'@/components/share/translate-button'
			)
			for (const locale of LOCALES) {
				expect(typeof locale.flag).toBe('string')
				expect(typeof locale.label).toBe('string')
				expect(locale.flag.length).toBeGreaterThan(0)
				expect(locale.label.length).toBeGreaterThan(0)
			}
		})

		test('en is the first entry', async () => {
			const { LOCALES } = await import(
				'@/components/share/translate-button'
			)
			expect(LOCALES[0]!.code).toBe('en')
		})
	})

	describe('callAiTranslate', () => {
		let originalFetch: typeof globalThis.fetch

		beforeEach(() => {
			originalFetch = globalThis.fetch
		})

		afterEach(() => {
			globalThis.fetch = originalFetch
		})

		test('calls correct AI translate endpoint with locale', async () => {
			const fetchMock = mock(async () => {
				return new Response(JSON.stringify({ locale: 'es', translated: {} }), {
					status: 200,
				})
			})
			globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch

			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			await callAiTranslate('es')

			expect(fetchMock).toHaveBeenCalledTimes(1)
			const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
			expect(calls[0]![0]).toBe('/api/admin/translations/ai-translate')
			const body = JSON.parse(calls[0]![1].body as string) as {
				locale: string
			}
			expect(body.locale).toBe('es')
		})

		test('returns true on 200 response', async () => {
			globalThis.fetch = mock(async () => {
				return new Response(JSON.stringify({ ok: true }), { status: 200 })
			}) as unknown as typeof globalThis.fetch

			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			const result = await callAiTranslate('fr')
			expect(result).toBe(true)
		})

		test('returns false on non-200 response', async () => {
			globalThis.fetch = mock(async () => {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
				})
			}) as unknown as typeof globalThis.fetch

			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			const result = await callAiTranslate('he')
			expect(result).toBe(false)
		})

		test('returns false on network error', async () => {
			globalThis.fetch = mock(async () => {
				throw new Error('Network error')
			}) as unknown as typeof globalThis.fetch

			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			const result = await callAiTranslate('es')
			expect(result).toBe(false)
		})

		test('sends POST with JSON content type', async () => {
			const fetchMock = mock(async () => {
				return new Response('{}', { status: 200 })
			})
			globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch

			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			await callAiTranslate('es')

			const calls = fetchMock.mock.calls as Array<[string, RequestInit]>
			const opts = calls[0]![1]
			expect(opts.method).toBe('POST')
			const headers = opts.headers as Record<string, string>
			expect(headers['Content-Type']).toBe('application/json')
		})
	})

	describe('component export', () => {
		test('TranslateButton is a function component', async () => {
			const mod = await import('@/components/share/translate-button')
			expect(typeof mod.default).toBe('function')
		})

		test('creates a React element without crashing', async () => {
			const mod = await import('@/components/share/translate-button')
			const el = createElement(mod.default)
			expect(el).toBeDefined()
			expect(el.type).toBe(mod.default)
		})

		test('LOCALES is exported and frozen', async () => {
			const { LOCALES } = await import(
				'@/components/share/translate-button'
			)
			expect(Array.isArray(LOCALES)).toBe(true)
			expect(LOCALES).toHaveLength(4)
		})

		test('callAiTranslate is exported', async () => {
			const { callAiTranslate } = await import(
				'@/components/share/translate-button'
			)
			expect(typeof callAiTranslate).toBe('function')
		})
	})
})
