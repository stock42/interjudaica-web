import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { TypeSafeUser } from "@/models/users";
import { UserStorage } from "@/services/users-storage";
import { ConfigStorage } from "@/services/config-storage";
import { getAuthSecret } from "@/services/auth-secret";

export const USER_SESSION_COOKIE_NAME = "__Host-interjudaica_user_session";
const USER_SESSION_MAX_AGE_DEFAULT = 60 * 60 * 24 * 7;

async function getUserSessionMaxAge() {
	return (await ConfigStorage.getNumber("user_session_max_age_seconds")) || USER_SESSION_MAX_AGE_DEFAULT;
}

type UserSessionPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function userSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: USER_SESSION_MAX_AGE_DEFAULT,
  };
}

export async function createUserSessionToken(user: TypeSafeUser) {
  const maxAge = await getUserSessionMaxAge();
  const now = Math.floor(Date.now() / 1000);
  const payload: UserSessionPayload = {
    sub: user.uuid,
    email: user.email,
    iat: now,
    exp: now + maxAge,
  };
  const body = encode(payload);
  return `${body}.${sign(body)}`;
}

export async function getUserFromToken(token?: string) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature || !signaturesMatch(sign(body), signature)) {
    return null;
  }

  let payload: UserSessionPayload;

  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const user = await UserStorage.findByUUID(payload.sub);

  if (!user || user.data.status !== "active") {
    return null;
  }

  if (user.data.passwordChangedAt && payload.iat) {
    const changedAt = new Date(user.data.passwordChangedAt).getTime() / 1000;
    if (payload.iat < changedAt) {
      return null;
    }
  }

  return UserStorage.toSafeUser(user);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserFromToken(cookieStore.get(USER_SESSION_COOKIE_NAME)?.value);
}

export async function authenticateUserApiRequest(request: NextRequest) {
  return getUserFromToken(request.cookies.get(USER_SESSION_COOKIE_NAME)?.value);
}
