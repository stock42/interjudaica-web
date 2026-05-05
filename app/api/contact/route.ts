import { NextResponse } from "next/server";
import { z } from "zod";

import { sendContactEmails } from "@/lib/send-contact-emails";

export const runtime = "nodejs";

const schemaContact = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schemaContact.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await sendContactEmails(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to send message",
      },
      { status: 500 },
    );
  }
}
