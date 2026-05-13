import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const passwordResetAttemptStatuses = ["success", "failed"] as const;

export const schemaPasswordResetAttempt = z.object({
	uuid: z.string().uuid().optional(),
	email: z.string().email().toLowerCase(),
	userUuid: z.string().uuid().optional(),
	status: z.enum(passwordResetAttemptStatuses),
	reason: z.string().trim().default(""),
	ip: z.string().trim().default(""),
	createdAt: z.string().trim().default(""),
});

export type TypePasswordResetAttempt = z.infer<typeof schemaPasswordResetAttempt>;

export class PasswordResetAttemptModel {
	private uuid: string;
	private attemptData: TypePasswordResetAttempt;

	constructor(props: TypePasswordResetAttempt) {
		const parsedData = schemaPasswordResetAttempt.parse(props);
		this.uuid = parsedData.uuid ?? createUuid();
		this.attemptData = {
			...parsedData,
			uuid: this.uuid,
		};
	}

	getData(): TypePasswordResetAttempt {
		return this.attemptData;
	}

	getUUID(): string {
		return this.uuid;
	}
}
