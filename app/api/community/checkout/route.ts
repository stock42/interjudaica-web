import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from "@/services/csrf";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { getBaseUrl } from "@/lib/base-url";
import { getStripe } from "@/lib/stripe";
import { SubscriptionPlanStorage } from "@/services/subscription-plans-storage";
import { ConfigStorage } from "@/services/config-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { activateCommunityMembership } from "@/services/community-memberships";
import { CouponStorage } from "@/services/coupons-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

const schemaCheckout = z.object({
	planUuid: z.string().uuid(),
	couponCode: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const csrfToken = request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
		if (!csrfToken || !verifyCsrfToken(csrfToken)) {
			return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 })
		}

		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const payload = schemaCheckout.parse(await readJson(request));
		const { planUuid, couponCode } = payload;

		const plan = await SubscriptionPlanStorage.get(planUuid);
		if (!plan) {
			return NextResponse.json({ error: "Plan not found" }, { status: 404 });
		}

		const stripe = getStripe();
		const baseUrl = getBaseUrl(request);
		const existingCommunityUser = await CommunityUserStorage.getByUserUuid(user.uuid);
		const currency = (await ConfigStorage.get("currency")) || "usd";

		const code = couponCode?.trim().toUpperCase() ?? "";
		let percentOff = 0;
		if (code) {
			const claimed = await CouponStorage.claimCoupon({
				code,
				scope: "community",
			});
			if (!claimed) {
				return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
			}
			percentOff = claimed.coupon.percentOff;
		}

		const discountedAmount = Math.max(
			0,
			Math.round(plan.price - plan.price * (percentOff / 100)),
		);

		if (percentOff === 100 || discountedAmount === 0) {
			await activateCommunityMembership({ userUuid: user.uuid, planUuid });
			return NextResponse.json({ url: `${baseUrl}/dashboard?community=success` });
		}

		const metadata: Record<string, string> = {
			community: "true",
			userUuid: user.uuid,
			planUuid,
		};

		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			payment_method_types: ["card"],
			...(existingCommunityUser?.stripeCustomerId
				? { customer: existingCommunityUser.stripeCustomerId }
				: { customer_email: user.email }),
			line_items: [
				{
					price_data: {
						currency,
						product_data: {
							name: plan.name,
							description: plan.description || `${plan.name} subscription`,
						},
						unit_amount: discountedAmount,
						recurring: { interval: plan.billingInterval },
					},
					quantity: 1,
				},
			],
			success_url: `${baseUrl}/dashboard?community=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/checkout-community?payment=cancelled&planUuid=${planUuid}`,
			metadata,
			subscription_data: { metadata },
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		return routeError(error, {
			event: "community_checkout_failed",
			route: "/api/community/checkout",
			method: request.method,
		});
	}
}
