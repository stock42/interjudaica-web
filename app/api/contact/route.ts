import { NextResponse } from "next/server";
import { z } from "zod";

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

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.turnstileToken && typeof body.turnstileToken === "string") {
    const valid = await verifyTurnstile(body.turnstileToken);
    if (!valid) {
      return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
    }
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
