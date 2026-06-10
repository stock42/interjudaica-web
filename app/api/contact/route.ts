import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { verifyCsrfToken, CSRF_COOKIE, CSRF_HEADER } from "@/services/csrf";
import { sendContactEmails } from "@/lib/send-contact-emails";
import { ContactStorage } from "@/services/contacts-storage";

export const runtime = "nodejs";

const schemaContact = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  message: z.string().trim().min(1).max(5000),
  turnstileToken: z.string().trim().min(1).optional(),
});

async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const data = await res.json() as { success: boolean };
  return data.success === true;
}

export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get(CSRF_HEADER) || request.cookies.get(CSRF_COOKIE)?.value
  if (!csrfToken || !verifyCsrfToken(csrfToken)) {
    return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 })
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (turnstileSecret) {
    if (!body.turnstileToken || typeof body.turnstileToken !== "string") {
      return NextResponse.json(
        { error: "CAPTCHA verification required" },
        { status: 400 },
      );
    }
    const valid = await verifyTurnstile(body.turnstileToken);
    if (!valid) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 400 },
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "TURNSTILE_SECRET_KEY not set — contact form is unprotected",
    );
  }

  const parsed = schemaContact.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }

  try {
    await ContactStorage.create(parsed.data);
    await sendContactEmails(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: "Unable to send message" },
      { status: 500 },
    );
  }
}
