import { describe, expect, test, mock } from 'bun:test'

// Mock external deps before imports
mock.module('server-only', () => ({}))

mock.module('@/components/ui/dialog', () => ({
	Dialog: () => null,
	DialogContent: () => null,
	DialogHeader: () => null,
	DialogTitle: () => null,
	DialogDescription: () => null,
	DialogFooter: () => null,
	DialogClose: () => null,
	DialogTrigger: () => null,
}))

mock.module('@/components/ui/button', () => ({
	Button: () => null,
}))

mock.module('@/components/ui/spinner', () => ({
	Spinner: () => null,
}))

mock.module('@ai-sdk/react', () => ({
	useChat: () => ({
		messages: [],
		sendMessage: mock(async () => {}),
		status: 'ready',
		setMessages: mock(() => {}),
		error: undefined,
	}),
}))

mock.module('ai', () => ({
	DefaultChatTransport: class {},
}))

mock.module('@/components/share/stt-microphone', () => ({
	default: () => null,
}))

mock.module('@/lib/utils', () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Now import the pure helpers
import {
	buildEntityPrompt,
	extractJsonFromText,
	getMessageText,
	formatKey,
	formatValue,
} from '@/app/admin/components/ai-create-modal'

// ═══════════════════════════════════════════════════════════════════
// buildEntityPrompt
// ═══════════════════════════════════════════════════════════════════

describe('buildEntityPrompt', () => {
	test('includes entity type and name', () => {
		const result = buildEntityPrompt({
			entityType: 'course',
			entityName: 'Course',
			userInput: 'A course about Jewish history',
		})

		expect(result).toInclude('Course')
		expect(result).toInclude('course')
		expect(result).toInclude('Jewish history')
	})

	test('includes system prompt when provided', () => {
		const result = buildEntityPrompt({
			entityType: 'paper',
			entityName: 'Paper',
			systemPrompt: 'Papers must have a category and author',
			userInput: 'A paper about Torah study',
		})

		expect(result).toInclude('category and author')
		expect(result).toInclude('Paper')
	})

	test('omits system prompt section when not provided', () => {
		const result = buildEntityPrompt({
			entityType: 'instructor',
			entityName: 'Instructor',
			userInput: 'Dr. Cohen',
		})

		expect(result).not.toInclude('Context and requirements')
	})

	test('includes JSON output instruction', () => {
		const result = buildEntityPrompt({
			entityType: 'course',
			entityName: 'Course',
			userInput: 'test',
		})

		expect(result).toInclude('```json')
		expect(result).toInclude('JSON')
	})

	test('handles empty user input', () => {
		const result = buildEntityPrompt({
			entityType: 'book',
			entityName: 'Book',
			userInput: '',
		})

		expect(result).toInclude('Book')
		expect(result).toInclude('My description:')
	})
})

// ═══════════════════════════════════════════════════════════════════
// extractJsonFromText
// ═══════════════════════════════════════════════════════════════════

describe('extractJsonFromText', () => {
	test('parses JSON from fenced code block (json tag)', () => {
		const result = extractJsonFromText(
			'Here is the data:\n```json\n{"title": "My Course", "price": 49}\n```',
		)
		expect(result).toEqual({ title: 'My Course', price: 49 })
	})

	test('parses JSON from fenced code block (no tag)', () => {
		const result = extractJsonFromText(
			'OK here:\n```\n{"title": "Test", "status": "published"}\n```',
		)
		expect(result).toEqual({ title: 'Test', status: 'published' })
	})

	test('parses raw JSON object from text', () => {
		const result = extractJsonFromText(
			'Here is the entity: {"name": "Rabbi Cohen", "bio": "Scholar"} Done.',
		)
		expect(result).toEqual({ name: 'Rabbi Cohen', bio: 'Scholar' })
	})

	test('prefers code block over raw JSON', () => {
		const result = extractJsonFromText(
			'Some text with {"wrong": "one"} and then\n```json\n{"correct": true}\n```',
		)
		expect(result).toEqual({ correct: true })
	})

	test('handles nested JSON objects', () => {
		const result = extractJsonFromText(
			'```json\n{"course": {"title": "Intro", "modules": [1,2,3]}}\n```',
		)
		expect(result).toEqual({
			course: { title: 'Intro', modules: [1, 2, 3] },
		})
	})

	test('returns null for empty string', () => {
		expect(extractJsonFromText('')).toBeNull()
	})

	test('returns null for text without JSON', () => {
		expect(
			extractJsonFromText(
				'I cannot create this entity because the information is insufficient.',
			),
		).toBeNull()
	})

	test('returns null for JSON array (not an object)', () => {
		expect(
			extractJsonFromText(
				'Here: ```json\n[{"a":1}, {"b":2}]\n```',
			),
		).toBeNull()
	})

	test('returns null for JSON primitive', () => {
		expect(
			extractJsonFromText('```json\n"just a string"\n```'),
		).toBeNull()
	})

	test('handles code block with surrounding whitespace', () => {
		const result = extractJsonFromText(
			'  ```json  \n  {"key": "value"}  \n  ```  ',
		)
		expect(result).toEqual({ key: 'value' })
	})

	test('handles JSON with special characters', () => {
		const result = extractJsonFromText(
			'```json\n{"desc": "Line 1\\nLine 2", "emoji": "✅"}\n```',
		)
		expect(result).toEqual({
			desc: 'Line 1\nLine 2',
			emoji: '✅',
		})
	})
})

// ═══════════════════════════════════════════════════════════════════
// getMessageText
// ═══════════════════════════════════════════════════════════════════

describe('getMessageText', () => {
	test('extracts text from message parts', () => {
		const text = getMessageText({
			parts: [
				{ type: 'text', text: 'Hello world' },
			],
		})
		expect(text).toBe('Hello world')
	})

	test('concatenates multiple text parts', () => {
		const text = getMessageText({
			parts: [
				{ type: 'text', text: 'First' },
				{ type: 'text', text: 'Second' },
			],
		})
		expect(text).toBe('First\nSecond')
	})

	test('filters out non-text parts', () => {
		const text = getMessageText({
			parts: [
				{ type: 'reasoning', text: 'think...' },
				{ type: 'text', text: 'Visible' },
				{ type: 'tool-call', input: {} },
			],
		})
		expect(text).toBe('Visible')
	})

	test('returns empty string for empty parts', () => {
		expect(getMessageText({ parts: [] })).toBe('')
	})

	test('returns empty string when parts is undefined', () => {
		expect(getMessageText({})).toBe('')
	})
})

// ═══════════════════════════════════════════════════════════════════
// formatKey
// ═══════════════════════════════════════════════════════════════════

describe('formatKey', () => {
	test('capitalizes first letter', () => {
		expect(formatKey('title')).toBe('Title')
	})

	test('adds spaces before capital letters in camelCase', () => {
		expect(formatKey('instructorName')).toBe(
			'Instructor Name',
		)
	})

	test('handles single word', () => {
		expect(formatKey('slug')).toBe('Slug')
	})

	test('handles already formatted keys', () => {
		expect(formatKey('Title')).toBe('Title')
	})

	test('handles empty string', () => {
		expect(formatKey('')).toBe('')
	})

	test('handles all lowercase', () => {
		expect(formatKey('priceinUSD')).toBe('Pricein U S D')
	})
})

// ═══════════════════════════════════════════════════════════════════
// formatValue
// ═══════════════════════════════════════════════════════════════════

describe('formatValue', () => {
	test('formats null as dash', () => {
		expect(formatValue(null)).toBe('—')
	})

	test('formats undefined as dash', () => {
		expect(formatValue(undefined)).toBe('—')
	})

	test('formats boolean true as Yes', () => {
		expect(formatValue(true)).toBe('Yes')
	})

	test('formats boolean false as No', () => {
		expect(formatValue(false)).toBe('No')
	})

	test('formats numbers as strings', () => {
		expect(formatValue(42)).toBe('42')
	})

	test('formats zero correctly', () => {
		expect(formatValue(0)).toBe('0')
	})

	test('formats arrays with count', () => {
		expect(formatValue(['a', 'b', 'c'])).toBe('3 items')
	})

	test('formats single-item array correctly', () => {
		expect(formatValue(['only'])).toBe('1 item')
	})

	test('formats empty array', () => {
		expect(formatValue([])).toBe('0 items')
	})

	test('formats objects as placeholder', () => {
		expect(formatValue({ nested: true })).toBe('{ … }')
	})

	test('formats strings as-is', () => {
		expect(formatValue('Hello')).toBe('Hello')
	})

	test('truncates long strings', () => {
		const long = 'a'.repeat(200)
		const result = formatValue(long)
		expect(result.length).toBeLessThanOrEqual(123) // 120 + '…'
		expect(result).toEndWith('…')
	})

	test('respects custom max length', () => {
		expect(formatValue('hello world', 5)).toBe(
			'hello…',
		)
	})

	test('does not truncate short strings', () => {
		expect(formatValue('hi')).toBe('hi')
	})
})
