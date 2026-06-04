import "server-only";

import type { TypeCommunityUser } from "@/models/community-users";
import type { TypeSafeUser } from "@/models/users";
import { getStripe } from "@/lib/stripe";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { UserStorage } from "@/services/users-storage";

type CommunityActivationInput = {
	userUuid: string;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	planUuid?: string;
};

type CommunityActivationResult =
	| {
			ok: true;
			user: TypeSafeUser;
			communityUser: TypeCommunityUser;
		}
	| {
			ok: false;
			reason: "invalid" | "pending" | "not_found";
			error: string;
		};

export function getStripeResourceId(value: unknown) {
	if (typeof value === "string") {
		return value;
	}

	if (
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		typeof value.id === "string"
	) {
		return value.id;
	}

	return "";
}

export function isActiveCommunityStatus(
	user: Pick<TypeSafeUser, "communityStatus">,
	communityUser?: Pick<TypeCommunityUser, "status"> | null,
) {
	if (communityUser) {
		return communityUser.status === "active";
	}

	return user.communityStatus === "active";
}

export async function hasActiveCommunityMembership(
	user: Pick<TypeSafeUser, "uuid" | "communityStatus">,
) {
	const communityUser = await CommunityUserStorage.getByUserUuid(user.uuid);
	return isActiveCommunityStatus(user, communityUser);
}

export async function activateCommunityMembership({
	userUuid,
	stripeCustomerId = "",
	stripeSubscriptionId = "",
	planUuid = "",
}: CommunityActivationInput): Promise<CommunityActivationResult> {
	const user = await UserStorage.get(userUuid);
	if (!user) {
		return {
			ok: false,
			reason: "not_found",
			error: "User not found",
		};
	}

	const communityPayload: Partial<TypeCommunityUser> = { userUuid };
	if (stripeCustomerId) {
		communityPayload.stripeCustomerId = stripeCustomerId;
	}
	if (stripeSubscriptionId) {
		communityPayload.stripeSubscriptionId = stripeSubscriptionId;
	}
	if (planUuid) {
		communityPayload.planUuid = planUuid;
	}

	const communityUser = await CommunityUserStorage.upsertActive(communityPayload);
	const updatedUser =
		(await UserStorage.update(userUuid, { communityStatus: "active" })) ?? user;

	return {
		ok: true,
		user: updatedUser,
		communityUser,
	};
}

export async function activateCommunityMembershipFromCheckoutSession(
	sessionId: string,
	userUuid: string,
): Promise<CommunityActivationResult> {
	if (!sessionId.startsWith("cs_")) {
		return {
			ok: false,
			reason: "invalid",
			error: "Invalid checkout session",
		};
	}

	const stripe = getStripe();
	const session = await stripe.checkout.sessions.retrieve(sessionId);
	const belongsToUser =
		session.mode === "subscription" &&
		session.metadata?.community === "true" &&
		session.metadata?.userUuid === userUuid;

	if (!belongsToUser) {
		return {
			ok: false,
			reason: "invalid",
			error: "Checkout session does not match this account",
		};
	}

	const checkoutComplete = session.status === "complete";
	const paymentSettled =
		session.payment_status === "paid" ||
		session.payment_status === "no_payment_required";

	if (!checkoutComplete || !paymentSettled) {
		return {
			ok: false,
			reason: "pending",
			error: "Payment is still being confirmed",
		};
	}

	return activateCommunityMembership({
		userUuid,
		stripeCustomerId: getStripeResourceId(session.customer),
		stripeSubscriptionId: getStripeResourceId(session.subscription),
	});
}
