import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { getCurrentUser } from "@/services/user-auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function POST() {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const stripe = getStripe();
	const baseUrl = await getBaseUrl();

	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		payment_method_types: ["card"],
		customer_email: user.email,
		line_items: [
			{
				price_data: {
					currency: "usd",
					product_data: {
						name: "InterJudaica Community",
						description: "Community membership subscription",
					},
					unit_amount: 1900,
					recurring: { interval: "month" },
				},
				quantity: 1,
			},
		],
		success_url: `${baseUrl}/dashboard?community=success`,
		cancel_url: `${baseUrl}/checkout-community?payment=cancelled`,
		metadata: {
			community: "true",
			userUuid: user.uuid,
		},
		subscription_data: {
			metadata: {
				community: "true",
				userUuid: user.uuid,
			},
		},
	});

	return NextResponse.json({ url: session.url });
}
