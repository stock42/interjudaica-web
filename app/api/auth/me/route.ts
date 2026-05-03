import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiRequest } from "@/services/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const operator = await authenticateApiRequest(request);

  if (!operator) {
    return NextResponse.json({ operator: null }, { status: 401 });
  }

  return NextResponse.json({ operator });
}

