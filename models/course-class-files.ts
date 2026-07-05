import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const schemaCourseClassFile = z.object({
	uuid: z.string().uuid().optional(),
	courseUuid: z.string().uuid(),
	classUuid: z.string().uuid(),
	title: z.string().trim().default(""),
	description: z.string().trim().default(""),
	originalName: z.string().trim().default(""),
	mimeType: z.string().trim().default(""),
	size: z.coerce.number().int().min(0).default(0),
	storagePath: z.string().trim().default(""),
});

export type TypeCourseClassFile = z.infer<typeof schemaCourseClassFile>;
export type TypeCourseClassFileInput = z.input<typeof schemaCourseClassFile>;

export class CourseClassFileModel {
	private uuid: string;
	private fileData: TypeCourseClassFile;

	constructor(props: TypeCourseClassFileInput) {
		const parsedData = schemaCourseClassFile.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.fileData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCourseClassFile {
		return this.fileData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
