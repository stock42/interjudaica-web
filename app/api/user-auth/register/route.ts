import { NextResponse, type NextRequest } from "next/server";
import { schemaUserSignup } from "@/models/users";
import { UserStorage } from "@/services/users-storage";
import { readJson, routeError } from "@/app/api/_lib/admin-api";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { sendWelcomeEmail } from "@/lib/send-welcome-email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = schemaUserSignup.parse(await readJson(request));
    const existing = await UserStorage.findByEmail(payload.email);

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const { user, verificationCode } = await UserStorage.register(payload);

    await Promise.all([
      sendVerificationEmail({
        email: payload.email,
        firstName: payload.firstName,
        code: verificationCode,
      }),
      sendWelcomeEmail({
        email: payload.email,
        firstName: payload.firstName,
      }),
    ]);

    return NextResponse.json(
      { user, verificationRequired: true },
      { status: 201 },
    );
  } catch (error) {
    return routeError(error);
  }
}
