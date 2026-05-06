import { NextResponse } from "next/server";
import { SocialProofStorage } from "@/services/social-proof-storage";

export const runtime = "nodejs";

export async function GET() {
  const items = await SocialProofStorage.listPublished();
  return NextResponse.json({ items });
}
