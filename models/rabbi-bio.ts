import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const schemaRabbiBio = z.object({
	uuid: z.string().uuid().optional(),
	slug: z.string().trim().min(1).default("ernesto-yattah"),
	title: z.string().trim().default("Rabbi Ernesto Yattah"),
	markdown: z.string().trim().default(""),
	updatedAt: z.string().trim().default(""),
});

export type TypeRabbiBio = z.infer<typeof schemaRabbiBio>;

export class RabbiBioModel {
	private uuid: string;
	private bioData: TypeRabbiBio;

	constructor(props: TypeRabbiBio) {
		const parsedData = schemaRabbiBio.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.bioData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeRabbiBio {
		return this.bioData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
