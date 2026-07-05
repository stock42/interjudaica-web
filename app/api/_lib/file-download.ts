import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

type DownloadableFile = {
	readonly storagePath: string;
	readonly mimeType: string;
	readonly originalName: string;
	readonly title: string;
};

function headerSafeFilename(name: string): string {
	const sanitized = path.basename(name).replace(/[\r\n"]/g, "_").trim();
	return sanitized || "class-file";
}

function createWebFileStream(filePath: string): ReadableStream<Uint8Array> {
	const fileStream = createReadStream(filePath);

	return new ReadableStream<Uint8Array>({
		start(controller) {
			fileStream.on("data", (chunk: Buffer | string) => {
				controller.enqueue(
					typeof chunk === "string" ? Buffer.from(chunk) : chunk,
				);
			});
			fileStream.on("end", () => controller.close());
			fileStream.on("error", (error: Error) => controller.error(error));
		},
		cancel() {
			fileStream.destroy();
		},
	});
}

export async function createFileDownloadResponse(file: DownloadableFile) {
	try {
		const stats = await stat(file.storagePath);
		const stream = createWebFileStream(file.storagePath);
		const filename = headerSafeFilename(file.originalName || file.title);

		return new NextResponse(stream, {
			headers: {
				"Content-Type": file.mimeType || "application/octet-stream",
				"Content-Length": stats.size.toString(),
				"Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		throw error;
	}
}
