import { z } from 'zod'
import { createUuid } from '@/models/model-utils'
import { publishingStatuses } from '@/models/courses'

export const schemaRecommendedBook = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(200),
	author: z.string().trim().min(2).max(200),
	coverImageUrl: z.string().trim().default(''),
	amazonLink: z.string().trim().default(''),
	description: z.string().trim().max(500).default(''),
	order: z.coerce.number().int().min(0).default(0),
	status: z.enum(publishingStatuses).default('draft'),
})

export type TypeRecommendedBook = z.infer<typeof schemaRecommendedBook>

export class RecommendedBookModel {
	private uuid: string
	private bookData: TypeRecommendedBook

	constructor(props: Partial<TypeRecommendedBook>) {
		const parsedData = schemaRecommendedBook.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.bookData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeRecommendedBook {
		return this.bookData
	}

	getUUID(): string {
		return this.uuid
	}
}
