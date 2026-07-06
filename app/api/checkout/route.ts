import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from '@/services/csrf'
import { CourseStorage } from '@/services/courses-storage'
import { CoursePaymentStorage } from '@/services/course-payments-storage'
import { CourseEnrollmentStorage } from '@/services/course-enrollments-storage'
import { CouponStorage } from '@/services/coupons-storage'
import { getCurrentUser } from '@/services/user-auth'
import { getBaseUrl } from '@/lib/base-url'
import { getStripe } from '@/lib/stripe'
import { sendCoursePaymentConfirmation } from '@/lib/send-course-payment-confirmation'
import { readJson, routeError } from '@/app/api/_lib/admin-api'

export const runtime = 'nodejs'

const schemaCheckout = z.object({
	courseUuid: z.string().uuid(),
	couponCode: z.string().trim().optional(),
})

export async function POST(request: NextRequest) {
	try {
		const csrfToken =
			request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
		if (!csrfToken || !verifyCsrfToken(csrfToken)) {
			return NextResponse.json(
				{ error: 'CSRF token missing or invalid' },
				{ status: 403 },
			)
		}

		const user = await getCurrentUser()
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const payload = schemaCheckout.parse(await readJson(request))
		const course = await CourseStorage.get(payload.courseUuid)
		if (!course || course.status !== 'published') {
			return NextResponse.json({ error: 'Course not available' }, { status: 404 })
		}

		const stripe = getStripe()
		const baseUrl = getBaseUrl(request)
		const amount = Math.round(course.price * 100)

		const couponCode = payload.couponCode?.trim().toUpperCase() ?? ''
		let percentOff = 0
		if (couponCode) {
			const claimed = await CouponStorage.claimCoupon({
				code: couponCode,
				scope: 'course',
				courseUuid: course.uuid ?? '',
			})
			if (!claimed) {
				return NextResponse.json({ error: 'Invalid coupon' }, { status: 400 })
			}
			percentOff = claimed.coupon.percentOff
		}

		const discountedAmount = Math.max(0, Math.round(amount - amount * (percentOff / 100)))

		if (percentOff === 100 || discountedAmount === 0) {
			await CourseEnrollmentStorage.create({
				courseUuid: course.uuid ?? '',
				userUuid: user.uuid,
				status: 'active',
				source: 'coupon',
				purchasedAt: new Date().toISOString(),
			})

			await CoursePaymentStorage.createPending({
				courseUuid: course.uuid ?? '',
				userUuid: user.uuid,
				amount: 0,
				currency: 'usd',
				couponCode,
				couponPercentOff: percentOff,
				discountedAmount: 0,
				stripeSessionId: '',
				status: 'paid',
				paidAt: new Date().toISOString(),
			})

			await sendCoursePaymentConfirmation({
				email: user.email,
				firstName: user.firstName,
				courseTitle: course.title,
				priceLabel: '$0',
			})

			return NextResponse.json({
				url: `${baseUrl}/dashboard?payment=success&course=${course.uuid}`,
			})
		}

		const description = (course.summary || course.description || '').trim()
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			payment_method_types: ['card'],
			customer_email: user.email,
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: course.title,
							...(description ? { description } : {}),
						},
						unit_amount: discountedAmount,
					},
					quantity: 1,
				},
			],
			success_url: `${baseUrl}/dashboard?payment=success&course=${course.uuid}`,
			cancel_url: `${baseUrl}/checkout/${course.uuid}?payment=cancelled`,
			metadata: {
				courseUuid: course.uuid ?? '',
				userUuid: user.uuid,
			},
		})

		await CoursePaymentStorage.createPending({
			courseUuid: course.uuid ?? '',
			userUuid: user.uuid,
			amount: course.price,
			currency: 'usd',
			couponCode,
			couponPercentOff: percentOff,
			discountedAmount: discountedAmount / 100,
			stripeSessionId: session.id,
		})

		return NextResponse.json({ url: session.url })
	} catch (error) {
		return routeError(error, {
			event: 'course_checkout_failed',
			route: '/api/checkout',
			method: request.method,
		})
	}
}
