import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const enrollmentStatuses = ['active', 'refunded', 'cancelled'] as const
export const enrollmentSources = ['stripe', 'manual', 'coupon', 'system'] as const

export const schemaCourseEnrollment = z.object({
	uuid: z.string().uuid().optional(),
	courseUuid: z.string().uuid(),
	userUuid: z.string().uuid(),
	status: z.enum(enrollmentStatuses).default('active'),
	source: z.enum(enrollmentSources).default('manual'),
	grantedByOperatorUuid: z.string().trim().default(''),
	grantedByOperatorEmail: z.string().trim().default(''),
	purchasedAt: z.string().trim().default(''),
})

export type TypeCourseEnrollment = z.infer<typeof schemaCourseEnrollment>
export type TypeCourseEnrollmentInput = z.input<typeof schemaCourseEnrollment>

export class CourseEnrollmentModel {
	private uuid: string
	private enrollmentData: TypeCourseEnrollment

	constructor(props: TypeCourseEnrollmentInput) {
		const parsedData = schemaCourseEnrollment.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.enrollmentData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeCourseEnrollment {
		return this.enrollmentData
	}

	getUUID(): string {
		return this.uuid
	}
}
