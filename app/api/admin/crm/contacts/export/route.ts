import { NextResponse, type NextRequest } from 'next/server'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)

	if ('response' in auth) {
		return auth.response
	}

	try {
		const { searchParams } = new URL(request.url)
		const query = searchParams.get('q') ?? ''
		const tagUuids = searchParams.get('tags')
			? searchParams.get('tags')!.split(',').filter(Boolean)
			: []

		const rows = await CrmContactStorage.getExportData({ query, tagUuids })

		// Build CSV
		const header = 'firstname,lastname,email,tags'
		const csvLines = rows.map((row) => {
			const escape = (val: string) => {
				if (val.includes(',') || val.includes('"') || val.includes('\n')) {
					return `"${val.replace(/"/g, '""')}"`
				}
				return val
			}

			return [
				escape(row.firstname),
				escape(row.lastname),
				escape(row.email),
				escape(row.tags),
			].join(',')
		})

		const csv = [header, ...csvLines].join('\n')

		return new NextResponse(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition':
					'attachment; filename="crm-contacts-export.csv"',
			},
		})
	} catch (error) {
		return routeError(error)
	}
}
