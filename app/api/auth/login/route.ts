import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  createOperatorSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/services/auth";
import { generateCsrfToken, csrfCookieOptions, CSRF_COOKIE } from "@/services/csrf";
import { OperatorStorage } from "@/services/operators-storage";
import { createRateLimiter } from "@/services/rate-limiter";
import { AuditLogStorage } from "@/services/audit-log-storage";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginLimiter = createRateLimiter("operator-login");

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateCheck = await loginLimiter.check(ip, 10, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email } = parsed.data;

  const operator = await OperatorStorage.findByEmail(email);
  if (operator && operator.data.loginLockedUntil) {
    const lockedUntil = new Date(operator.data.loginLockedUntil).getTime();
    if (Date.now() < lockedUntil) {
      const retryAfter = Math.ceil((lockedUntil - Date.now()) / 1000);
      await AuditLogStorage.log({
        action: "operator.login.locked",
        email,
        ip,
        details: `Account locked until ${operator.data.loginLockedUntil}`,
      });
      return NextResponse.json(
        { error: "Account temporarily locked" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  }

  const authenticated = await OperatorStorage.authenticate(
    email,
    parsed.data.password,
  );

  if (!authenticated) {
    if (operator) {
      const attempts = (operator.data.loginAttempts ?? 0) + 1;
      const update: Record<string, unknown> = { loginAttempts: attempts };
      if (attempts >= 5) {
        update.loginLockedUntil = new Date(Date.now() + 900000).toISOString();
      }
      await OperatorStorage.updateRaw(operator.uuid, update);
    }

    await AuditLogStorage.log({
      action: "operator.login.failed",
      email,
      ip,
      details: "Invalid credentials",
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await loginLimiter.reset(ip);

  await OperatorStorage.updateRaw(authenticated.uuid, {
    loginAttempts: 0,
    loginLockedUntil: "",
  });

  await AuditLogStorage.log({
    action: "operator.login.success",
    email,
    ip,
    details: "Login successful",
  });

  const response = NextResponse.json({ operator: authenticated });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    await createOperatorSessionToken(authenticated),
    sessionCookieOptions(),
  );
  response.cookies.set(
    CSRF_COOKIE,
    generateCsrfToken(),
    csrfCookieOptions(),
  );

  return response;
}
