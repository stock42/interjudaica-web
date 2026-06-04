import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const emailSpoolerStatuses = ['new', 'sent', 'error'] as const

export const schemaEmailSpooler = z.object({
	uuid: z.string().uuid().optional(),
	from: z.string().email(),
	to: z.string().email(),
	body: z.string().min(1),
	campaignUuid: z.string().uuid(),
	deliveryTime: z.string().trim().nullable().default(null),
	status: z.enum(emailSpoolerStatuses).default('new'),
	error: z.string().trim().nullable().default(null),
})

export type TypeEmailSpooler = z.infer<typeof schemaEmailSpooler>

export class EmailSpoolerModel {
	private uuid: string
	private spoolerData: TypeEmailSpooler

	constructor(props: TypeEmailSpooler) {
		const parsedData = schemaEmailSpooler.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.spoolerData = {
			...parsedData,
			uuid: this.uuid,
		}
	}

	getData(): TypeEmailSpooler {
		return this.spoolerData
	}

	getUUID(): string {
		return this.uuid
	}
}
