import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const enrollmentStatuses = ["active", "refunded", "cancelled"] as const;

export const schemaCourseEnrollment = z.object({
	uuid: z.string().uuid().optional(),
	courseUuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	status: z.enum(enrollmentStatuses).default("active"),
	purchasedAt: z.string().trim().default(""),
});

export type TypeCourseEnrollment = z.infer<typeof schemaCourseEnrollment>;

export class CourseEnrollmentModel {
	private uuid: string;
	private enrollmentData: TypeCourseEnrollment;

	constructor(props: TypeCourseEnrollment) {
		const parsedData = schemaCourseEnrollment.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.enrollmentData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypeCourseEnrollment {
		return this.enrollmentData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
