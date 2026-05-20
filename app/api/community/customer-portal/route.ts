import { NextResponse, type NextRequest } from "next/server";

import { getBaseUrl } from "@/lib/base-url";
import { reportError } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const baseUrl = getBaseUrl(request);
	const unavailableUrl = `${baseUrl}/dashboard?billing=unavailable`;

	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.redirect(`${baseUrl}/login?next=/dashboard`);
		}

		const communityUser = await CommunityUserStorage.getByUserUuid(user.uuid);
		if (!communityUser?.stripeCustomerId) {
			return NextResponse.redirect(unavailableUrl);
		}

		const stripe = getStripe();
		const session = await stripe.billingPortal.sessions.create({
			customer: communityUser.stripeCustomerId,
			return_url: `${baseUrl}/dashboard?billing=return`,
		});

		return NextResponse.redirect(session.url);
	} catch (error) {
		reportError({
			event: "community_customer_portal_failed",
			error,
			route: "/api/community/customer-portal",
			method: request.method,
			context: {
				hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
			},
		});
		return NextResponse.redirect(unavailableUrl);
	}
}
