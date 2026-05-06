import "server-only";

import { headers } from "next/headers";
import type { TypeSocialProof } from "@/models/social-proof";

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");

  if (!host) {
    return "http://localhost:3025";
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function listSocialProof(): Promise<TypeSocialProof[]> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/social-proof`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { items?: TypeSocialProof[] };
  return data.items ?? [];
}
