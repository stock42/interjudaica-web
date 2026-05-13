import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const bookSaleStatuses = ["pending", "paid", "failed"] as const;

export const schemaBookSale = z.object({
	uuid: z.string().uuid().optional(),
	bookUuid: z.string().uuid(),
	bookTitle: z.string().trim().default(""),
	buyerFirstName: z.string().trim().default(""),
	buyerLastName: z.string().trim().default(""),
	buyerEmail: z.string().email().toLowerCase(),
	amount: z.coerce.number().nonnegative().default(0),
	currency: z.string().trim().default("usd"),
	status: z.enum(bookSaleStatuses).default("pending"),
	stripeSessionId: z.string().trim().default(""),
	stripePaymentIntentId: z.string().trim().default(""),
	accessToken: z.string().trim().default(""),
	createdAt: z.string().trim().default(""),
	paidAt: z.string().trim().default(""),
});

export type TypeBookSale = z.infer<typeof schemaBookSale>;

export class BookSaleModel {
	private uuid: string;
	private saleData: TypeBookSale;

	constructor(props: TypeBookSale) {
		const parsedData = schemaBookSale.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.saleData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeBookSale {
		return this.saleData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
