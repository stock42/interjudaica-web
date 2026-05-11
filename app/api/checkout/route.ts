import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { CourseStorage } from "@/services/courses-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { getCurrentUser } from "@/services/user-auth";
import { getStripe } from "@/lib/stripe";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { headers } from "next/headers";

export const runtime = "nodejs";

const schemaCheckout = z.object({
	courseUuid: z.string().uuid(),
});

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const payload = schemaCheckout.parse(await readJson(request));
		const course = await CourseStorage.get(payload.courseUuid);
		if (!course || course.status !== "published") {
			return NextResponse.json({ error: "Course not available" }, { status: 404 });
		}

		const stripe = getStripe();
		const baseUrl = await getBaseUrl();
		const amount = Math.round(course.price * 100);

		const description = (course.summary || course.description || "").trim();
		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			customer_email: user.email,
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: course.title,
							...(description ? { description } : {}),
						},
						unit_amount: amount,
					},
					quantity: 1,
				},
			],
			success_url: `${baseUrl}/dashboard?payment=success&course=${course.uuid}`,
			cancel_url: `${baseUrl}/checkout/${course.uuid}?payment=cancelled`,
			metadata: {
				courseUuid: course.uuid ?? "",
				userUuid: user.uuid,
			},
		});

		await CoursePaymentStorage.createPending({
			courseUuid: course.uuid ?? "",
			userUuid: user.uuid,
			amount: course.price,
			currency: "usd",
			stripeSessionId: session.id,
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		return routeError(error);
	}
}
