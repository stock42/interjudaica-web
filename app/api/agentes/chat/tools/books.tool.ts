import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'
import { registerTool } from '@/lib/llm-tool-auth'
import { schemaBook } from '@/models/books'
import { BookStorage } from '@/services/books-storage'
import { BookSaleStorage } from '@/services/book-sales-storage'

// ── Book Tools ──

export const listBooks = tool({
	description: 'List all books (includes drafts and published)',
	inputSchema: z.object({}),
	execute: async () => {
		const books = await BookStorage.list()
		return { count: books.length, books }
	},
})
registerTool('listBooks', { role: 'admin' })

export const getBook = tool({
	description:
		'Get a single book by UUID. Returns full book data including description and file path.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Book UUID'),
	}),
	execute: async ({ uuid }) => {
		const book = await BookStorage.get(uuid)
		if (!book) throw new Error(`Book not found: ${uuid}`)
		return book
	},
})
registerTool('getBook', { role: 'admin' })

export const createBook = tool({
	description:
		'Create a new book. Title is required; all other fields have sensible defaults. Price in USD cents.',
	inputSchema: schemaBook.omit({ uuid: true, slug: true }),
	execute: async (input) => {
		const book = await BookStorage.create(input)
		return book
	},
})
registerTool('createBook', { role: 'admin' })

export const updateBook = tool({
	description: 'Update an existing book by UUID. Only fields provided will be changed.',
	inputSchema: schemaBook
		.partial()
		.extend({ uuid: z.string().uuid().describe('Book UUID to update') }),
	execute: async ({ uuid, ...data }) => {
		const updated = await BookStorage.update(uuid, data)
		if (!updated) throw new Error(`Book not found: ${uuid}`)
		return updated
	},
})
registerTool('updateBook', { role: 'admin' })

export const deleteBook = tool({
	description:
		'Delete a book by UUID. WARNING: This is a destructive action that requires approval.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('Book UUID to delete'),
	}),
	execute: async ({ uuid }) => {
		const deleted = await BookStorage.delete(uuid)
		if (!deleted) throw new Error(`Book not found or already deleted: ${uuid}`)
		return { deleted: true, uuid }
	},
})
registerTool('deleteBook', { role: 'admin', needsApproval: true })

// ── Book Sales Tools ──

export const listBookSales = tool({
	description:
		'List all book sales records. Returns summary data only — access tokens are excluded for security.',
	inputSchema: z.object({}),
	execute: async () => {
		const sales = await BookSaleStorage.list()

		// Strip access tokens for security (per MUST NOT rule)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const safe = sales.map(({ accessToken, ...rest }) => rest)

		return { count: safe.length, sales: safe }
	},
})
registerTool('listBookSales', { role: 'admin' })
