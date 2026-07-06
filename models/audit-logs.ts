import { z } from 'zod'
import { createUuid } from '@/models/model-utils'

export const auditActorKinds = ['operator', 'student', 'system'] as const

export const schemaAuditLog = z.object({
	uuid: z.string().uuid().optional(),
	action: z.string().trim().min(1),
	email: z.string().trim().default(''),
	ip: z.string().trim().default('unknown'),
	details: z.string().trim().default(''),
	actorKind: z.enum(auditActorKinds).default('system'),
	actorUuid: z.string().trim().default(''),
	subjectType: z.string().trim().default(''),
	subjectUuid: z.string().trim().default(''),
	courseUuid: z.string().trim().default(''),
	classUuid: z.string().trim().default(''),
	createdAt: z.string().trim().default(''),
})

export type TypeAuditLog = z.infer<typeof schemaAuditLog>
export type TypeAuditLogInput = z.input<typeof schemaAuditLog>

export class AuditLogModel {
	private uuid: string
	private logData: TypeAuditLog

	constructor(props: TypeAuditLogInput) {
		const parsedData = schemaAuditLog.parse(props)
		this.uuid = parsedData.uuid ?? createUuid()
		this.logData = {
			...parsedData,
			uuid: this.uuid,
			createdAt: parsedData.createdAt || new Date().toISOString(),
		}
	}

	getData(): TypeAuditLog {
		return this.logData
	}

	getUUID(): string {
		return this.uuid
	}
}
