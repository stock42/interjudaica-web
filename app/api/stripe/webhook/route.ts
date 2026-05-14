import { NextResponse } from "next/server";
import Stripe from "stripe";

import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { CourseStorage } from "@/services/courses-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";
import { BookSaleStorage } from "@/services/book-sales-storage";
import { WebhookEventStorage } from "@/services/webhook-event-storage";
import { getStripe } from "@/lib/stripe";
import { sendCoursePaymentConfirmation } from "@/lib/send-course-payment-confirmation";
import { sendBookPaymentConfirmation } from "@/lib/send-book-payment-confirmation";
import { sendCourseEnrollmentEmail } from "@/lib/send-course-enrollment-email";
import { formatUsd } from "@/app/lib/content";

export const runtime = "nodejs";

function requireEnv(name: string) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

export async function POST(request: Request) {
	const signature = request.headers.get("stripe-signature");
	if (!signature) {
		return NextResponse.json({ error: "Missing signature" }, { status: 400 });
	}

	const stripe = getStripe();
	const body = await request.text();
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			requireEnv("STRIPE_WEBHOOK_SECRET"),
		);
	} catch {
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	const alreadyProcessed = await WebhookEventStorage.isProcessed(event.id);
	if (alreadyProcessed) {
		return NextResponse.json({ received: true });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const courseUuid = session.metadata?.courseUuid;
		const userUuid = session.metadata?.userUuid;
		const isCommunity = session.metadata?.community === "true";
		const bookUuid = session.metadata?.bookUuid;

		if (isCommunity && userUuid) {
			const user = await UserStorage.get(userUuid);

			if (user) {
				await CommunityUserStorage.upsertActive({
					userUuid: user.uuid,
					stripeCustomerId: String(session.customer ?? ""),
					stripeSubscriptionId: String(session.subscription ?? ""),
				});

				await UserStorage.update(user.uuid, {
					communityStatus: "active",
				});
			}
		}

		if (courseUuid && userUuid) {
			await CoursePaymentStorage.updateBySession(session.id, {
				status: "paid",
				paidAt: new Date().toISOString(),
				stripePaymentIntentId: String(session.payment_intent ?? ""),
			});

			try {
				await CourseEnrollmentStorage.create({
					courseUuid,
					userUuid,
					status: "active",
					purchasedAt: new Date().toISOString(),
				});
			} catch {
				// ignore duplicate enrollment
			}

			const [course, user] = await Promise.all([
				CourseStorage.get(courseUuid),
				UserStorage.get(userUuid),
			]);

			if (course && user) {
				await sendCoursePaymentConfirmation({
					email: user.email,
					firstName: user.firstName,
					courseTitle: course.title,
					priceLabel: formatUsd(course.price),
				});
				await sendCourseEnrollmentEmail({
					email: user.email,
					firstName: user.firstName,
					courseTitle: course.title,
					startDate: course.startDate || undefined,
					zoomLink: course.zoomLink || undefined,
				});
			}
		}

		if (bookUuid) {
			await BookSaleStorage.markPaid(
				session.id,
				String(session.payment_intent ?? ""),
			);

			const sale = await BookSaleStorage.getBySession(session.id);

			if (sale) {
				const downloadUrl = sale.accessToken
					? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3025"}/api/books/download?token=${sale.accessToken}`
					: undefined;
				await sendBookPaymentConfirmation({
					email: sale.buyerEmail,
					firstName: sale.buyerFirstName,
					bookTitle: sale.bookTitle,
					priceLabel: formatUsd(sale.amount),
					downloadUrl,
				});
			}
		}
	}

	if (event.type === "checkout.session.expired") {
		const session = event.data.object as Stripe.Checkout.Session;
		await CoursePaymentStorage.updateBySession(session.id, {
			status: "failed",
		});
		await BookSaleStorage.markFailed(session.id);
	}

	if (event.type === "customer.subscription.deleted") {
		const subscription = event.data.object as Stripe.Subscription;
		const userUuid = subscription.metadata?.userUuid;

		await CommunityUserStorage.markCancelledBySubscription(subscription.id);

		if (userUuid) {
			await UserStorage.update(userUuid, { communityStatus: "cancelled" });
		}
	}

	await WebhookEventStorage.markProcessed(event.id);
	return NextResponse.json({ received: true });
}
