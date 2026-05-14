import { NextResponse, type NextRequest } from "next/server";
import { TranslationStorage } from "@/services/translations-storage";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) return auth.response;

	const url = new URL(request.url);
	const locale = url.searchParams.get("locale") ?? "en";
	const dict = await TranslationStorage.getAll(locale);
	return NextResponse.json({ locale, dictionary: dict });
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) return auth.response;

	try {
		const { locale, translations } = await readJson(request) as {
			locale: string;
			translations: Record<string, string>;
		};
		await TranslationStorage.setTranslations(locale, translations);
		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
