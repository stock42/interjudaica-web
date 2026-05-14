import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";
import { publishingStatuses } from "@/models/courses";

export const schemaPage = z.object({
	uuid: z.string().uuid().optional(),
	slug: z.string().trim().optional(),
	title: z.string().trim().min(2).max(200),
	description: z.string().trim().max(500).default(""),
	content: z.string().trim().max(100000).default(""),
	status: z.enum(publishingStatuses).default("draft"),
});

export type TypePage = z.infer<typeof schemaPage>;

export class PageModel {
	private uuid: string;
	private pageData: TypePage;

	constructor(props: TypePage) {
		const parsedData = schemaPage.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.pageData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.title),
		};
	}

	getData(): TypePage {
		return this.pageData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
