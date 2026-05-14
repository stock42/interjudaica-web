import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";
import { publishingStatuses } from "@/models/courses";

export const schemaBook = z.object({
	uuid: z.string().uuid().optional(),
	slug: z.string().trim().optional(),
	title: z.string().trim().min(2).max(200),
	description: z.string().trim().max(500).default(""),
	longDescription: z.string().trim().max(10000).default(""),
	coverUrl: z.string().trim().default(""),
	filePath: z.string().trim().default(""),
	price: z.coerce.number().nonnegative().default(0),
	status: z.enum(publishingStatuses).default("draft"),
});

export type TypeBook = z.infer<typeof schemaBook>;

export class BookModel {
	private uuid: string;
	private bookData: TypeBook;

	constructor(props: TypeBook) {
		const parsedData = schemaBook.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.bookData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.title),
		};
	}

	getData(): TypeBook {
		return this.bookData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
