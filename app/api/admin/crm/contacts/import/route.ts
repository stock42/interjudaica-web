import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import {
	schemaCrmContactImport,
	type TypeCrmContactImport,
} from '@/models/crm-contacts'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		// Parse multipart/form-data — NOT JSON
		const formData = await request.formData()
		const file = formData.get('file') as File | null

		if (!file) {
			return NextResponse.json(
				{ error: 'CSV file is required' },
				{ status: 400 },
			)
		}

		const text = await file.text()
		const lines = text
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)

		if (lines.length < 2) {
			return NextResponse.json(
				{ error: 'CSV file must have a header and at least one row' },
				{ status: 400 },
			)
		}

		const header = lines[0].toLowerCase()
		if (
			!header.includes('firstname') ||
			!header.includes('lastname') ||
			!header.includes('email')
		) {
			return NextResponse.json(
				{
					error:
						'CSV must have columns: firstname, lastname, email (case-insensitive)',
				},
				{ status: 400 },
			)
		}

		const headerColumns = lines[0]
			.split(',')
			.map((h) => h.trim().toLowerCase())
		const firstnameIdx = headerColumns.indexOf('firstname')
		const lastnameIdx = headerColumns.indexOf('lastname')
		const emailIdx = headerColumns.indexOf('email')

		const contacts: TypeCrmContactImport[] = []
		const validationErrors: { line: number; email: string; error: string }[] = []

		for (let i = 1; i < lines.length; i++) {
			const columns = lines[i].split(',').map((c) => c.trim())
			const firstname = (columns[firstnameIdx] ?? '').trim()
			const lastname = (columns[lastnameIdx] ?? '').trim()
			const email = (columns[emailIdx] ?? '').trim()

			if (!firstname || !lastname || !email) {
				validationErrors.push({
					line: i + 1, // 1-based line number in the file
					email: email || '(missing)',
					error: 'Missing required field (firstname, lastname, or email)',
				})
				continue
			}

			// Validate row with Zod before adding to import batch
			try {
				const validated = schemaCrmContactImport.parse({
					firstname,
					lastname,
					email,
				})
				contacts.push(validated)
			} catch (err) {
				const messages =
					err instanceof ZodError
						? err.issues.map((e) => e.message).join('; ')
						: 'Invalid row'
				validationErrors.push({ line: i + 1, email, error: messages })
			}
		}

		if (contacts.length === 0) {
			return NextResponse.json(
				{
					error: 'No valid contacts found in CSV',
					imported: 0,
					skipped: 0,
					validationErrors,
				},
				{ status: 400 },
			)
		}

		const result = await CrmContactStorage.bulkImport(contacts)

		return NextResponse.json({
			...result,
			validationErrors:
				validationErrors.length > 0 ? validationErrors : undefined,
		})
	} catch (error) {
		return routeError(error)
	}
}
