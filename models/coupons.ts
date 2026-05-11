import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const couponScopes = ["all", "course", "community"] as const;

export const schemaCoupon = z.object({
	uuid: z.string().uuid().optional(),
	code: z.string().trim().min(3).transform((value) => value.toUpperCase()),
	percentOff: z.coerce.number().min(0).max(100),
	scope: z.enum(couponScopes).default("all"),
	courseUuid: z.string().uuid().optional().or(z.literal("")),
	active: z.coerce.boolean().default(true),
	expiresAt: z.string().trim().default(""),
	usageLimit: z.coerce.number().int().min(0).default(0),
	usageCount: z.coerce.number().int().min(0).default(0),
});

export type TypeCoupon = z.infer<typeof schemaCoupon>;

export class CouponModel {
	private uuid: string;
	private couponData: TypeCoupon;

	constructor(props: TypeCoupon) {
		const parsedData = schemaCoupon.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.couponData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCoupon {
		return this.couponData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
