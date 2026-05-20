export function serializeError(error: unknown) {
	if (error instanceof Error) {
		return {
			message: error.message,
			stack: error.stack ?? "",
			name: error.name,
		};
	}

	if (typeof error === "string") {
		return {
			message: error,
			stack: "",
			name: "Error",
		};
	}

	return {
		message: "Unknown error",
		stack: "",
		name: "UnknownError",
	};
}
