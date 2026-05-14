import { NextResponse, type NextRequest } from "next/server";
import { CourseStorage } from "@/services/courses-storage";
import { BookStorage } from "@/services/books-storage";
import { UserStorage } from "@/services/users-storage";
import { PageStorage } from "@/services/pages-storage";
import { PaperStorage } from "@/services/papers-storage";
import { requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) return auth.response;

	const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

	if (!q || q.length < 2) {
		return NextResponse.json({ items: [] });
	}

	try {
		const [courses, books, users, pages, papers] = await Promise.all([
			CourseStorage.list(),
			BookStorage.list(),
			UserStorage.list(),
			PageStorage.list(),
			PaperStorage.list(),
		]);

		const results: Array<{ title: string; subtitle: string; entity: string; href: string }> = [];

		for (const c of courses) {
			if (c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) {
				results.push({ title: c.title, subtitle: `Course · ${c.category}`, entity: "courses", href: `/admin/courses/${c.uuid}` });
			}
		}
		for (const b of books) {
			if (b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)) {
				results.push({ title: b.title, subtitle: "Book", entity: "books", href: `/admin/books/${b.uuid}` });
			}
		}
		for (const u of users) {
			const name = `${u.firstName} ${u.lastName}`.trim();
			if (u.email.toLowerCase().includes(q) || name.toLowerCase().includes(q)) {
				results.push({ title: name || u.email, subtitle: `User · ${u.email}`, entity: "users", href: `/admin/users` });
			}
		}
		for (const p of pages) {
			if (p.title.toLowerCase().includes(q)) {
				results.push({ title: p.title, subtitle: "CMS Page", entity: "pages", href: `/admin/pages/${p.uuid}` });
			}
		}
		for (const p of papers) {
			if (p.title.toLowerCase().includes(q)) {
				results.push({ title: p.title, subtitle: "Paper", entity: "papers", href: `/admin/papers/${p.uuid}` });
			}
		}

		return NextResponse.json({ items: results.slice(0, 20) });
	} catch (error) {
		return routeError(error);
	}
}
