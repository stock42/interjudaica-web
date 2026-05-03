import { NextResponse, type NextRequest } from "next/server";
import {
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/services/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}

