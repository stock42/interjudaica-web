import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { CouponStorage } from "@/services/coupons-storage";
import { getStripe } from "@/lib/stripe";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { ConfigStorage } from "@/services/config-storage";

export const runtime = "nodejs";

const schemaCheckout = z.object({
	couponCode: z.string().trim().optional(),
});

function getBaseUrl(request: NextRequest) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (siteUrl) return siteUrl;
	const proto = request.headers.get("x-forwarded-proto") ?? "https";
	const host = request.headers.get("host");
	if (host) return `${proto}://${host}`;
	return "http://localhost:3025";
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const payload = schemaCheckout.parse(await readJson(request));
		const stripe = getStripe();
		const baseUrl = getBaseUrl(request);
		const baseAmount = await ConfigStorage.getNumber("community_membership_price_cents");
		const currency = await ConfigStorage.get("currency");

		const couponCode = payload.couponCode?.trim().toUpperCase() ?? "";
		let percentOff = 0;
		if (couponCode) {
			const claimed = await CouponStorage.claimCoupon({
				code: couponCode,
				scope: "community",
			});
			if (!claimed) {
				return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
			}
			percentOff = claimed.coupon.percentOff;
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
					currency,
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
