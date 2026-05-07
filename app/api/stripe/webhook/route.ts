import { NextResponse } from "next/server";
import Stripe from "stripe";

import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { getStripe } from "@/lib/stripe";

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

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const courseUuid = session.metadata?.courseUuid;
		const userUuid = session.metadata?.userUuid;

		if (courseUuid && userUuid) {
			await CourseEnrollmentStorage.ensureIndexes();
			await CoursePaymentStorage.updateBySession(session.id, {
				status: "paid",
				paidAt: new Date().toISOString(),
				stripePaymentIntentId: String(session.payment_intent ?? ""),
			});

			await CourseEnrollmentStorage.ensureIndexes();
			await CourseEnrollmentStorage.create({
				courseUuid,
				userUuid,
				status: "active",
				purchasedAt: new Date().toISOString(),
			});
		}
	}

	return NextResponse.json({ received: true });
}
