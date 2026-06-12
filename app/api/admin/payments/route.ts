import { NextResponse, type NextRequest } from 'next/server'
import { CoursePaymentStorage } from '@/services/course-payments-storage'
import { BookSaleStorage } from '@/services/book-sales-storage'
import { CommunityUserStorage } from '@/services/community-users-storage'
import { CourseStorage } from '@/services/courses-storage'
import { SubscriptionPlanStorage } from '@/services/subscription-plans-storage'
import { UserStorage } from '@/services/users-storage'
import { requireAdminApi, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

type PaymentType = 'course' | 'book' | 'subscription'

interface UnifiedPayment {
	id: string
	type: PaymentType
	status: string
	amount: number
	currency: string
	user: { name: string; email: string }
	item: string
	date: string
	stripeSessionId: string
	stripePaymentIntentId: string
}

async function buildUnifiedPayments(): Promise<UnifiedPayment[]> {
	const [coursePayments, bookSales, communityUsers, users, courses, plans] =
		await Promise.all([
			CoursePaymentStorage.list(),
			BookSaleStorage.list(),
			CommunityUserStorage.list(),
			UserStorage.list(),
			CourseStorage.list(),
			SubscriptionPlanStorage.list(),
		])

	const userByUuid = new Map(users.map((u) => [u.uuid, u]))
	const courseById = new Map(courses.map((c) => [c.uuid, c]))
	const planById = new Map(plans.map((p) => [p.uuid, p]))

	const unified: UnifiedPayment[] = []

	// Course payments
	for (const p of coursePayments) {
		const user = userByUuid.get(p.userUuid)
		const course = courseById.get(p.courseUuid)
		if (!user) continue
		unified.push({
			id: p.uuid ?? '',
			type: 'course',
			status: p.status,
			amount: p.amount,
			currency: p.currency || 'usd',
			user: { name: `${user.firstName} ${user.lastName}`.trim(), email: user.email },
			item: course?.title ?? `Course ${p.courseUuid}`,
			date: p.paidAt || p.createdAt || '',
			stripeSessionId: p.stripeSessionId || '',
			stripePaymentIntentId: p.stripePaymentIntentId || '',
		})
	}

	// Book sales
	for (const s of bookSales) {
		unified.push({
			id: s.uuid ?? '',
			type: 'book',
			status: s.status,
			amount: s.amount,
			currency: s.currency || 'usd',
			user: {
				name: `${s.buyerFirstName} ${s.buyerLastName}`.trim(),
				email: s.buyerEmail,
			},
			item: s.bookTitle || `Book ${s.bookUuid}`,
			date: s.paidAt || s.createdAt || '',
			stripeSessionId: s.stripeSessionId || '',
			stripePaymentIntentId: s.stripePaymentIntentId || '',
		})
	}

	// Community subscriptions
	for (const cu of communityUsers) {
		const user = userByUuid.get(cu.userUuid)
		if (!user) continue
		const plan = planById.get(cu.planUuid)
		unified.push({
			id: cu.uuid ?? '',
			type: 'subscription',
			status: cu.status,
			amount: plan?.price ?? 0,
			currency: 'usd',
			user: { name: `${user.firstName} ${user.lastName}`.trim(), email: user.email },
			item: plan?.name ?? `Plan ${cu.planUuid}`,
			date: cu.subscribedAt || '',
			stripeSessionId: '',
			stripePaymentIntentId: '',
		})
	}

	return unified
}

function csvEscape(value: string): string {
	return `"${value.replace(/"/g, '""')}"`
}

function unifiedToCSV(payments: UnifiedPayment[]): string {
	const headers = [
		'ID',
		'Type',
		'Status',
		'Amount',
		'Currency',
		'User Name',
		'User Email',
		'Item',
		'Date',
		'Stripe Session ID',
		'Stripe Payment Intent ID',
	]
	const rows = payments.map((p) => [
		csvEscape(p.id),
		csvEscape(p.type),
		csvEscape(p.status),
		p.amount.toFixed(2),
		csvEscape(p.currency),
		csvEscape(p.user.name),
		csvEscape(p.user.email),
		csvEscape(p.item),
		csvEscape(p.date),
		csvEscape(p.stripeSessionId),
		csvEscape(p.stripePaymentIntentId),
	])
	return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request)
	if ('response' in auth) return auth.response

	const params = request.nextUrl.searchParams
	const format = params.get('format')?.trim().toLowerCase() ?? ''
	const search = params.get('search')?.trim().toLowerCase() ?? ''
	const typeFilter = params.get('type')?.trim().toLowerCase() as PaymentType | null
	const page = Math.max(Number(params.get('page')) || 1, 1)
	const limit = Math.min(Math.max(Number(params.get('limit')) || 30, 1), 100)

	try {
		const unified = await buildUnifiedPayments()

		// Filter by type
		let filtered = unified
		if (typeFilter && ['course', 'book', 'subscription'].includes(typeFilter)) {
			filtered = filtered.filter((p) => p.type === typeFilter)
		}

		// Filter by search (case-insensitive on user name, email, item)
		if (search) {
			filtered = filtered.filter((p) => {
				const name = p.user.name.toLowerCase()
				const email = p.user.email.toLowerCase()
				const item = p.item.toLowerCase()
				return name.includes(search) || email.includes(search) || item.includes(search)
			})
		}

		// Sort by date descending
		filtered.sort((a, b) => {
			const da = a.date ? new Date(a.date).getTime() : 0
			const db = b.date ? new Date(b.date).getTime() : 0
			return db - da
		})

		if (format === 'csv') {
			const csv = unifiedToCSV(filtered)
			return new NextResponse(csv, {
				status: 200,
				headers: {
					'Content-Type': 'text/csv; charset=utf-8',
					'Content-Disposition': 'attachment; filename="payments.csv"',
				},
			})
		}

		const totalItems = filtered.length
		const totalPages = Math.ceil(totalItems / limit)
		const start = (page - 1) * limit
		const items = filtered.slice(start, start + limit)

		return NextResponse.json({ items, page, totalPages, totalItems })
	} catch (error) {
		return routeError(error)
	}
}
