import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import {
  createOperatorSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/services/auth";
import { OperatorStorage } from "@/services/operators-storage";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
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

  const operator = await OperatorStorage.authenticate(
    parsed.data.email,
    parsed.data.password,
  );

  if (!operator) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ operator });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createOperatorSessionToken(operator),
    sessionCookieOptions(),
  );

  return response;
}

