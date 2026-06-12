'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Web Speech API types — not yet in the standard TypeScript lib      */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean
	interimResults: boolean
	lang: string
	onresult: ((event: SpeechRecognitionEvent) => void) | null
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
	onend: (() => void) | null
	start(): void
	stop(): void
	abort(): void
}

interface SpeechRecognitionEvent extends Event {
	readonly resultIndex: number
	readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
	readonly length: number
	item(index: number): SpeechRecognitionResult
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean
	readonly length: number
	item(index: number): SpeechRecognitionAlternative
	[index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
	readonly transcript: string
	readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string
	readonly message: string
}

type SttState = 'idle' | 'requesting' | 'listening' | 'error' | 'unsupported'

interface SttMicrophoneProps {
	onTranscription: (text: string) => void
	onError?: (error: string) => void
	className?: string
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
	const win = window as Window & {
		SpeechRecognition?: SpeechRecognitionConstructor
		webkitSpeechRecognition?: SpeechRecognitionConstructor
	}
	const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition
	if (typeof Ctor === 'undefined') return null
	return Ctor
}

export default function SttMicrophone({
	onTranscription,
	onError,
	className = '',
}: SttMicrophoneProps) {
	const [state, setState] = useState<SttState>(() => {
		return getSpeechRecognition() ? 'idle' : 'unsupported'
	})
	const [errorMessage, setErrorMessage] = useState('')

	const recognitionRef = useRef<SpeechRecognition | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const onTranscriptionRef = useRef(onTranscription)
	const onErrorRef = useRef(onError)

	useEffect(() => {
		onTranscriptionRef.current = onTranscription
		onErrorRef.current = onError
	})

	const stopListening = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		if (recognitionRef.current) {
			try {
				recognitionRef.current.stop()
			} catch {
				/* already stopped */
			}
			recognitionRef.current = null
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}
	}, [])

	const setError = useCallback(
		(message: string) => {
			stopListening()
			setErrorMessage(message)
			setState('error')
			onErrorRef.current?.(message)
		},
		[stopListening],
	)

	const startListening = useCallback(async () => {
		setErrorMessage('')
		setState('requesting')

		/* Step 1 — request mic permission via getUserMedia */
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream
		} catch {
			setError('Microphone access was denied. Please allow microphone access in your browser settings and try again.')
			return
		}

		/* Step 2 — stop the stream (we only needed it for the permission prompt)
			 Keeping it alive can cause echo / double-audio. */
		streamRef.current?.getTracks().forEach((track) => track.stop())
		streamRef.current = null

		/* Step 3 — start SpeechRecognition */
		const Ctor = getSpeechRecognition()
		if (!Ctor) {
			setError('Speech recognition is not supported in this browser.')
			return
		}

		const recognition = new Ctor()
		recognition.continuous = false
		recognition.interimResults = false
		recognition.lang = 'en-US'

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			const transcript = event.results?.[0]?.[0]?.transcript
			if (transcript) {
				stopListening()
				setState('idle')
				onTranscriptionRef.current(transcript.trim())
			}
		}

		recognition.onerror = (event: Event) => {
			const e = event as SpeechRecognitionErrorEvent
			if (e.error === 'no-speech') {
				setError('No speech detected. Please try again.')
			} else if (e.error === 'aborted') {
				/* user clicked again or component unmounted — not an error */
				stopListening()
				setState('idle')
			} else if (e.error === 'not-allowed') {
				setError('Microphone access was denied. Please allow microphone access in your browser settings and try again.')
			} else {
				setError(e.error ?? 'An error occurred during speech recognition.')
			}
		}

		recognition.onend = () => {
			/* If we're still in listening state when recognition ends
				 without a result, treat it as a timeout / no-speech */
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
			/* Only transition if we are still listening (not already handled by result/error) */
			setState((prev) => (prev === 'listening' ? 'idle' : prev))
		}

		recognitionRef.current = recognition
		setState('listening')
		recognition.start()

		/* Auto-stop after 10s of silence */
		timeoutRef.current = setTimeout(() => {
			try {
				recognition.stop()
			} catch {
				/* ignore */
			}
			setError('No speech detected within the time limit. Please try again.')
		}, 10_000)
	}, [setError, stopListening])

	const handleClick = useCallback(() => {
		if (state === 'listening') {
			stopListening()
			setState('idle')
			return
		}
		if (state === 'requesting') {
			/* debounce double-clicks while permission prompt is open */
			return
		}
		startListening()
	}, [state, startListening, stopListening])

	/* Cleanup on unmount */
	useEffect(() => {
		return () => {
			stopListening()
		}
	}, [stopListening])

	/* Unsupported browser fallback */
	if (state === 'unsupported') {
		return (
			<span className={`text-sm text-[var(--muted)] ${className}`}>
				Speech recognition not supported
			</span>
		)
	}

	return (
		<div className={`inline-flex flex-col items-start gap-2 ${className}`}>
			<button
				type="button"
				onClick={handleClick}
				disabled={state === 'requesting'}
				aria-label={
					state === 'listening'
						? 'Stop voice input'
						: 'Start voice input'
				}
				className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all
					${state === 'listening'
						? 'border-[var(--gold)] bg-[rgba(244,189,51,0.12)] text-[var(--gold)]'
						: 'border-[var(--line-soft)] bg-[var(--surface-soft)] text-[var(--ink)] hover:border-[var(--line)] hover:bg-[var(--surface)]'
					}
					disabled:cursor-not-allowed disabled:opacity-50`}
			>
				{/* Microphone icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					className="h-4 w-4"
					aria-hidden="true"
				>
					<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" y1="19" x2="12" y2="22" />
				</svg>

				{state === 'listening' ? (
					<span className="flex items-center gap-1.5">
						{/* Pulsing red dot */}
						<span className="flex h-2 w-2">
							<span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[var(--sumac)] opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--sumac)]" />
						</span>
						Listening...
					</span>
				) : state === 'requesting' ? (
					'Requesting...'
				) : (
					'Voice input'
				)}
			</button>

			{state === 'error' && errorMessage && (
				<p
					className="text-xs text-[var(--sumac)]"
					role="alert"
				>
					{errorMessage}
				</p>
			)}
		</div>
	)
}
