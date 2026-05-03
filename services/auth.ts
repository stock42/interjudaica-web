import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { TypeSafeOperator } from "@/models/operators";
import { OperatorStorage } from "@/services/operators-storage";

export const SESSION_COOKIE_NAME = "interjudaica_operator_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

type SessionPayload = {
  sub: string;
  email: string;
  level: number;
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
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function createOperatorSessionToken(operator: TypeSafeOperator) {
  const payload: SessionPayload = {
    sub: operator.uuid,
    email: operator.email,
    level: operator.level,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
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
    redirect("/login?next=/admin");
  }

  return operator;
}

export async function authenticateApiRequest(request: NextRequest) {
  return getOperatorFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

