import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const communityStatuses = ["active", "cancelled"] as const;

export const schemaCommunityUser = z.object({
	uuid: z.string().uuid().optional(),
	userUuid: z.string().uuid(),
	status: z.enum(communityStatuses).default("active"),
	subscribedAt: z.string().trim().default(""),
	stripeCustomerId: z.string().trim().default(""),
	stripeSubscriptionId: z.string().trim().default(""),
	planUuid: z.string().trim().default(""),
});

export type TypeCommunityUser = z.infer<typeof schemaCommunityUser>;

export class CommunityUserModel {
	private uuid: string;
	private communityData: TypeCommunityUser;

	constructor(props: TypeCommunityUser) {
		const parsedData = schemaCommunityUser.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.communityData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCommunityUser {
		return this.communityData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
