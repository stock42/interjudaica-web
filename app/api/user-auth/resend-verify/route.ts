import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { UserStorage } from "@/services/users-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { sendVerificationEmail } from "@/lib/send-verification-email";

export const runtime = "nodejs";

const schemaResend = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest) {
	try {
		const payload = schemaResend.parse(await readJson(request));
		const result = await UserStorage.regenerateVerificationCode(payload.email);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		await sendVerificationEmail({
			email: result.email,
			firstName: result.firstName,
			code: result.code,
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
