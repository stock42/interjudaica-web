import "server-only";

import { headers } from "next/headers";
import type { TypeCourseClass } from "@/models/course-classes";

async function getBaseUrl() {
	const headerList = await headers();
	const host = headerList.get("host");

	if (!host) {
		return "http://localhost:3025";
	}

	const protocol = host.includes("localhost") ? "http" : "https";
	return `${protocol}://${host}`;
}

export async function listCourseClasses(slug: string): Promise<TypeCourseClass[]> {
	const baseUrl = await getBaseUrl();
	const response = await fetch(`${baseUrl}/api/courses/${slug}/classes`, {
		cache: "no-store",
	});

	if (!response.ok) {
		return [];
	}

	const data = (await response.json()) as { items?: TypeCourseClass[] };
	return data.items ?? [];
}
