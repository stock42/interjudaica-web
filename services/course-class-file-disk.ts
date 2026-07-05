import "server-only";

import { unlink } from "fs/promises";

function isFileMissingError(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof error.code === "string" &&
		error.code === "ENOENT"
	);
}

export async function removeStoredCourseClassFile(storagePath: string) {
	try {
		await unlink(storagePath);
	} catch (error) {
		if (isFileMissingError(error)) {
			return;
		}

		throw error;
	}
}
