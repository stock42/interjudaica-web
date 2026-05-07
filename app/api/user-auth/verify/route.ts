import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
	createUserSessionToken,
	userSessionCookieOptions,
	USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";

export const runtime = "nodejs";

const schemaVerify = z.object({
	email: z.string().email().transform((value) => value.toLowerCase()),
	code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
	try {
		const payload = schemaVerify.parse(await readJson(request));
		const result = await UserStorage.verifyEmailCode(
			payload.email,
			payload.code,
		);

		if (!result.ok) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}

		const response = NextResponse.json({ user: result.user });
		response.cookies.set(
			USER_SESSION_COOKIE_NAME,
			createUserSessionToken(result.user),
			userSessionCookieOptions(),
		);

		await sendWelcomeEmail({
			email: result.user.email,
			firstName: result.user.firstName,
		});

		return response;
	} catch (error) {
		return routeError(error);
	}
}
