import { NextResponse, type NextRequest } from "next/server";
import { authenticateUserApiRequest } from "@/services/user-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await authenticateUserApiRequest(request);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
