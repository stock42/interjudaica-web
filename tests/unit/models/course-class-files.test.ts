import { describe, expect, test } from "bun:test";

import { CourseClassFileModel } from "@/models/course-class-files";

const courseUuid = "11111111-1111-4111-8111-111111111111";
const classUuid = "22222222-2222-4222-8222-222222222222";

describe("CourseClassFileModel", () => {
	test("stores description metadata for class materials", () => {
		const model = new CourseClassFileModel({
			courseUuid,
			classUuid,
			title: "Source packet",
			description: "Read before the live session.",
			originalName: "sources.zip",
			mimeType: "application/zip",
			size: 2048,
			storagePath: "/tmp/sources.zip",
		});

		const data = model.getData();

		expect(typeof data.uuid).toBe("string");
		expect(data.description).toBe("Read before the live session.");
		expect(data.mimeType).toBe("application/zip");
	});

	test("defaults optional metadata for older file records", () => {
		const model = new CourseClassFileModel({
			courseUuid,
			classUuid,
			originalName: "recording.weba",
			mimeType: "",
			size: 4096,
			storagePath: "/tmp/recording.weba",
		});

		const data = model.getData();

		expect(data.title).toBe("");
		expect(data.description).toBe("");
		expect(data.mimeType).toBe("");
	});
});
