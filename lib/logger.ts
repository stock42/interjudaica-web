import "server-only";

import { serializeError } from "@/lib/error-utils";
import { ErrorEventStorage } from "@/services/error-events-storage";

export { serializeError } from "@/lib/error-utils";

type ErrorContext = {
	event: string;
	error: unknown;
	statusCode?: number;
	route?: string;
	method?: string;
	context?: Record<string, unknown>;
	level?: "error" | "warn";
};

export function reportError({
	event,
	error,
	statusCode = 500,
	route = "",
	method = "",
	context = {},
	level = "error",
}: ErrorContext) {
	const serialized = serializeError(error);
	const payload = {
		timestamp: new Date().toISOString(),
		level,
		event,
		statusCode,
		route,
		method,
		message: serialized.message,
		name: serialized.name,
		stack: serialized.stack,
		context,
	};

	console[level === "warn" ? "warn" : "error"](JSON.stringify(payload));

	void ErrorEventStorage.record({
		level,
		event,
		message: serialized.message,
		stack: serialized.stack,
		statusCode,
		route,
		method,
		context,
	}).catch((storageError) => {
		const storagePayload = serializeError(storageError);
		console.error(
			JSON.stringify({
				timestamp: new Date().toISOString(),
				level: "error",
				event: "error_event_storage_failed",
				message: storagePayload.message,
				stack: storagePayload.stack,
			}),
		);
	});
}
