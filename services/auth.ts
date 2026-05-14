import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { TypeSafeOperator } from "@/models/operators";
import { OperatorStorage } from "@/services/operators-storage";
import { ConfigStorage } from "@/services/config-storage";

export const SESSION_COOKIE_NAME = "__Host-interjudaica_operator_session";
const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 8;

async function getSessionMaxAge() {
	return (await ConfigStorage.getNumber("operator_session_max_age_seconds")) || SESSION_MAX_AGE_DEFAULT;
}

type SessionPayload = {
  sub: string;
  email: string;
  level: number;
  iat: number;
  exp: number;
};

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "interjudaica-local-development-secret"
  );
}

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

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_MAX_AGE_DEFAULT,
  };
}

export async function createOperatorSessionToken(operator: TypeSafeOperator) {
  const maxAge = await getSessionMaxAge();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: operator.uuid,
    email: operator.email,
    level: operator.level,
    iat: now,
    exp: now + maxAge,
  };
  const body = encode(payload);
  return `${body}.${sign(body)}`;
}

export async function getOperatorFromToken(token?: string) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature || !signaturesMatch(sign(body), signature)) {
    return null;
  }

  let payload: SessionPayload;

  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  await OperatorStorage.ensureDefaultOperator();
  const operator = await OperatorStorage.findByUUID(payload.sub);

  if (!operator || !operator.data.enabled) {
    return null;
  }

  if (operator.data.passwordChangedAt && payload.iat) {
    const changedAt = new Date(operator.data.passwordChangedAt).getTime() / 1000;
    if (payload.iat < changedAt) {
      return null;
    }
  }

  return OperatorStorage.toSafeOperator(operator);
}

export async function getCurrentOperator() {
  const cookieStore = await cookies();
  return getOperatorFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireOperator() {
  await OperatorStorage.ensureDefaultOperator();
  const operator = await getCurrentOperator();

  if (!operator) {
    redirect("/operator-login?next=/admin");
  }

  return operator;
}

export async function authenticateApiRequest(request: NextRequest) {
  return getOperatorFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}
