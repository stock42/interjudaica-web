import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test'

;(globalThis as Record<string, unknown>).window = {
	addEventListener: () => {},
	removeEventListener: () => {},
	dispatchEvent: () => true,
	navigator: { userAgent: 'bun-test' },
	location: { href: 'http://localhost' },
	document: {
		createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
		createTextNode: () => ({}),
	},
}

import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

let mockGetUserMedia: ReturnType<typeof mock>

beforeEach(() => {
	mockGetUserMedia = mock(() => Promise.resolve({ getTracks: () => [] }))
	const nav = globalThis as Record<string, unknown> & { navigator?: { mediaDevices?: unknown } }
	if (!nav.navigator) nav.navigator = { mediaDevices: undefined }
	nav.navigator.mediaDevices = { getUserMedia: mockGetUserMedia }
})

afterEach(() => {
	mock.restore()
	delete (globalThis as Record<string, unknown>).window.SpeechRecognition
	delete (globalThis as Record<string, unknown>).window.webkitSpeechRecognition
})

function setSpeechRecognitionAvailable() {
	const win = globalThis as Record<string, unknown> & { window: Record<string, unknown> }
	win.window.SpeechRecognition = class {
		continuous = false
		interimResults = false
		lang = 'en-US'
		onresult: ((e: unknown) => void) | null = null
		onerror: ((e: unknown) => void) | null = null
		onend: (() => void) | null = null
		start() {}
		stop() {}
		abort() {}
	}
}

describe('SttMicrophone', () => {
	test('renders the voice input button when SpeechRecognition is available', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).toContain('Voice input')
		expect(html).toContain('aria-label="Start voice input"')
		expect(html).toContain('<button')
	})

	test('does not contain listening state on initial render', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).not.toContain('Listening...')
		expect(html).not.toContain('Requesting...')
	})

	test('shows unsupported fallback when SpeechRecognition is absent', async () => {
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).toContain('Speech recognition not supported')
	})

	test('button has correct aria-label', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).toContain('aria-label="Start voice input"')
	})

	test('renders with custom className merged', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
				className: 'my-custom',
			}),
		)

		expect(html).toContain('my-custom')
	})

	test('renders microphone SVG icon', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).toContain('<svg')
		expect(html).toContain('viewBox="0 0 24 24"')
		expect(html).toContain('aria-hidden="true"')
	})

	test('does not render error message on initial render', async () => {
		setSpeechRecognitionAvailable()
		const mod = await import('@/components/share/stt-microphone')
		const html = renderToStaticMarkup(
			createElement(mod.default, {
				onTranscription: () => {},
			}),
		)

		expect(html).not.toContain('role="alert"')
	})
})
