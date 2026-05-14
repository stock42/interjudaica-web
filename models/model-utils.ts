import { randomUUID, randomInt } from "crypto";

export function createUuid() {
  return randomUUID();
}

export function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString();
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function linesToArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).map((line) => line.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

