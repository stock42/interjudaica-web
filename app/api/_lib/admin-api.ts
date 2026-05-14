import { ZodError } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiRequest } from "@/services/auth";
import { verifyCsrfToken, CSRF_HEADER } from "@/services/csrf";

export async function requireAdminApi(request: NextRequest) {
  const operator = await authenticateApiRequest(request);

  if (!operator) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (request.method !== "GET") {
    const csrf = request.headers.get(CSRF_HEADER);
    if (!csrf || !verifyCsrfToken(csrf)) {
      return {
        response: NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 }),
      };
    }
  }

  return { operator };
}

export async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function routeError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message === "Invalid JSON body") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json(
      { error: "A record with this unique value already exists" },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

