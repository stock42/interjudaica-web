import { z } from 'zod'
import { createUuid, slugify } from '@/models/model-utils'

export const schemaEmailTemplate = z.object({
	uuid: z.string().uuid().optional(),
	name: z.string().trim().min(2).max(300),
	slug: z.string().trim().optional(),
	subject: z.string().trim().min(1).max(500),
	html: z.string().trim().default(''),
})

export type TypeEmailTemplate = z.infer<typeof schemaEmailTemplate>

export class EmailTemplateModel {
	private uuid: string
	private templateData: TypeEmailTemplate

	constructor(props: TypeEmailTemplate) {
		const parsedData = schemaEmailTemplate.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.templateData = {
			...parsedData,
			uuid: this.uuid,
			slug: slugify(parsedData.name),
		}
	}

	getData(): TypeEmailTemplate {
		return this.templateData
	}

	getUUID(): string {
		return this.uuid
	}
}
