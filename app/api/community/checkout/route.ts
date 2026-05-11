import { NextResponse, type NextRequest } from "next/server";

import { getStripe } from "@/lib/stripe";
import { CouponStorage } from "@/services/coupons-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";
import { getCurrentUser } from "@/services/user-auth";
import { headers } from "next/headers";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { z } from "zod";

export const runtime = "nodejs";

const schemaCheckout = z.object({
	couponCode: z.string().trim().optional(),
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
		const stripe = getStripe();
		const baseUrl = await getBaseUrl();
		const baseAmount = 1900;

		const couponCode = payload.couponCode?.trim().toUpperCase() ?? "";
		let percentOff = 0;
		if (couponCode) {
			const coupon = await CouponStorage.findValid({
				code: couponCode,
				scope: "community",
			});
			if (!coupon) {
				return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
			}
			percentOff = coupon.coupon.percentOff;
			await CouponStorage.incrementUsage(coupon.uuid);
		}

		const discountedAmount = Math.max(
			0,
			Math.round(baseAmount - baseAmount * (percentOff / 100)),
		);

		if (percentOff === 100 || discountedAmount === 0) {
			await CommunityUserStorage.upsertActive({ userUuid: user.uuid });
			await UserStorage.update(user.uuid, { communityStatus: "active" });
			return NextResponse.json({ url: `${baseUrl}/dashboard?community=success` });
		}

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
					unit_amount: discountedAmount,
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
	} catch (error) {
		return routeError(error);
	}
}
