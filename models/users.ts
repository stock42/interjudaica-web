import { z } from "zod";
import { createUuid } from "@/models/model-utils";
import {
  hashPassword,
  verifyPassword as verifyStoredPassword,
} from "@/models/passwords";

export const userStatuses = ["active", "disabled", "pending"] as const;
export const communityStatuses = ["none", "active", "cancelled", "manual"] as const;

export const schemaUser = z.object({
  uuid: z.string().uuid().optional(),
  email: z.string().email().transform((email) => email.toLowerCase()),
  firstName: z.string().trim().default(""),
  lastName: z.string().trim().default(""),
  country: z.string().trim().default(""),
  state: z.string().trim().default(""),
  city: z.string().trim().default(""),
	password: z.string().default(""),
  role: z.string().trim().default("student"),
  status: z.enum(userStatuses).default("active"),
  communityStatus: z.enum(communityStatuses).default("none"),
  emailVerificationCode: z.string().trim().default(""),
  emailVerificationExpiresAt: z.string().trim().default(""),
  emailVerifiedAt: z.string().trim().default(""),
  passwordResetCode: z.string().trim().default(""),
  passwordResetExpiresAt: z.string().trim().default(""),
  passwordResetAttempts: z.coerce.number().int().min(0).default(0),
  passwordResetAttemptsWindowStart: z.string().trim().default(""),
  passwordResetLockedUntil: z.string().trim().default(""),
});

export const schemaUserSignup = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  country: z.string().trim().min(1),
  state: z.string().trim().min(1),
  city: z.string().trim().min(1),
  password: z.string().min(8).max(128),
});

export const schemaUserSignin = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

export const schemaAdminUser = schemaUser.omit({ password: true });

export type TypeUser = z.infer<typeof schemaUser>;
export type TypeUserSignup = z.infer<typeof schemaUserSignup>;
export type TypeUserSignin = z.infer<typeof schemaUserSignin>;
export type TypeSafeUser = Omit<
  TypeUser,
  "password" |
    "uuid" |
    "emailVerificationCode" |
    "emailVerificationExpiresAt" |
    "emailVerifiedAt" |
    "passwordResetCode" |
    "passwordResetExpiresAt" |
    "passwordResetAttempts" |
    "passwordResetAttemptsWindowStart" |
    "passwordResetLockedUntil"
> & {
  uuid: string;
};

export class UserModel {
  private uuid: string;
  private userData: TypeUser;

  constructor(props: TypeUser) {
    const parsedData = schemaUser.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.userData = {
      ...parsedData,
      uuid: this.uuid,
    };
  }

  getData(): TypeUser {
    return this.userData;
  }

  getUUID(): string {
    return this.uuid;
  }

  async setPassword(password: string) {
    this.userData.password = await hashPassword(password);
  }

  async verifyPassword(password: string): Promise<boolean> {
    return verifyStoredPassword(password, this.userData.password);
  }

  toSafeData(): TypeSafeUser {
    return {
      uuid: this.uuid,
      email: this.userData.email,
      firstName: this.userData.firstName,
      lastName: this.userData.lastName,
      country: this.userData.country,
      state: this.userData.state,
      city: this.userData.city,
      role: this.userData.role,
      status: this.userData.status,
      communityStatus: this.userData.communityStatus,
    };
  }
}
