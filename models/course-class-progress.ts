import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const schemaCourseClassProgress = z.object({
	uuid: z.string().uuid().optional(),
	userUuid: z.string().uuid(),
	courseUuid: z.string().uuid(),
	classUuid: z.string().uuid(),
	completed: z.coerce.boolean().default(false),
	completedAt: z.string().trim().default(''),
	lastAccessedAt: z.string().trim().default(''),
})

export type TypeCourseClassProgress = z.infer<typeof schemaCourseClassProgress>
export type TypeCourseClassProgressInput = z.input<typeof schemaCourseClassProgress>

export class CourseClassProgressModel {
	private uuid: string
	private progressData: TypeCourseClassProgress

	constructor(props: TypeCourseClassProgressInput) {
		const parsedData = schemaCourseClassProgress.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.progressData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeCourseClassProgress {
		return this.progressData
	}

	getUUID(): string {
		return this.uuid
	}
}
