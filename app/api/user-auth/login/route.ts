import { NextResponse, type NextRequest } from "next/server";
import { schemaUserSignin } from "@/models/users";
import {
  createUserSessionToken,
  userSessionCookieOptions,
  USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";
import { UserStorage } from "@/services/users-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = schemaUserSignin.parse(await readJson(request));
    const user = await UserStorage.authenticate(payload.email, payload.password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    response.cookies.set(
      USER_SESSION_COOKIE_NAME,
      createUserSessionToken(user),
      userSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return routeError(error);
  }
}
