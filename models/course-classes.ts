import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const schemaCourseClass = z.object({
	uuid: z.string().uuid().optional(),
	courseUuid: z.string().uuid(),
	title: z.string().trim().min(1),
	description: z.string().trim().default(""),
	imageUrl: z.string().trim().default(""),
	order: z.coerce.number().int().min(0).default(0),
});

export type TypeCourseClass = z.infer<typeof schemaCourseClass>;

export class CourseClassModel {
	private uuid: string;
	private classData: TypeCourseClass;

	constructor(props: TypeCourseClass) {
		const parsedData = schemaCourseClass.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.classData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCourseClass {
		return this.classData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
