import { NextResponse, type NextRequest } from "next/server";
import {
  userSessionCookieOptions,
  USER_SESSION_COOKIE_NAME,
} from "@/services/user-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  response.cookies.set(USER_SESSION_COOKIE_NAME, "", {
    ...userSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
