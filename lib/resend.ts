import "server-only";

import { Resend } from "resend";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getResend() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

export function getEmailFrom() {
  return requireEnv("EMAIL_FROM");
}
