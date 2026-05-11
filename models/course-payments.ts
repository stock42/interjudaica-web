import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const paymentStatuses = [
	"pending",
	"paid",
	"failed",
	"refunded",
] as const;

export const schemaCoursePayment = z.object({
	uuid: z.string().uuid().optional(),
	courseUuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	amount: z.coerce.number().nonnegative().default(0),
	currency: z.string().trim().default("usd"),
	status: z.enum(paymentStatuses).default("pending"),
	stripeSessionId: z.string().trim().default(""),
	stripePaymentIntentId: z.string().trim().default(""),
	couponCode: z.string().trim().default(""),
	couponPercentOff: z.coerce.number().min(0).max(100).default(0),
	discountedAmount: z.coerce.number().nonnegative().default(0),
	createdAt: z.string().trim().default(""),
	paidAt: z.string().trim().default(""),
});

export type TypeCoursePayment = z.infer<typeof schemaCoursePayment>;

export class CoursePaymentModel {
	private uuid: string;
	private paymentData: TypeCoursePayment;

	constructor(props: TypeCoursePayment) {
		const parsedData = schemaCoursePayment.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.paymentData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCoursePayment {
		return this.paymentData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
