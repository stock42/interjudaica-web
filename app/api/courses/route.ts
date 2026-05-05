import { NextResponse } from "next/server";
import { listPublicCourses } from "@/app/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listPublicCourses();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Unable to load courses" },
      { status: 500 },
    );
  }
}
