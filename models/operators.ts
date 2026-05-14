import { z } from "zod";
import { createUuid, generateVerificationCode } from "@/models/model-utils";
import {
  hashPassword,
  verifyPassword as verifyStoredPassword,
} from "@/models/passwords";

export const schemaOperator = z.object({
  email: z
    .string()
    .email("insert a valid email")
    .transform((email) => email.toLowerCase()),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  verifyCode: z.string().optional(),
  password: z.string(),
  uuid: z.string().uuid().optional(),
  level: z.number().int().min(1).max(50).default(50),
  passwordChangedAt: z.string().trim().default("").optional(),
  loginAttempts: z.coerce.number().int().min(0).default(0).optional(),
  loginLockedUntil: z.string().trim().default("").optional(),
});

export const schemaOperatorCreate = z.object({
  email: z
    .string()
    .email("insert a valid email")
    .transform((email) => email.toLowerCase()),
  firstName: z.string().trim().nullable().optional(),
  lastName: z.string().trim().nullable().optional(),
  enabled: z.coerce.boolean().default(true),
	password: z.string().min(8).max(128),
  level: z.coerce.number().int().min(1).max(50).default(50),
});

export const schemaOperatorUpdate = schemaOperatorCreate
  .partial()
  .extend({
    password: z.string().min(8).optional().or(z.literal("")),
  });

export type TypeOperator = z.infer<typeof schemaOperator>;
export type TypeSafeOperator = Omit<
  TypeOperator,
  "password" | "verifyCode" | "uuid" | "passwordChangedAt" | "loginAttempts" | "loginLockedUntil"
> & {
  uuid: string;
};
export type TypeOperatorCreate = z.infer<typeof schemaOperatorCreate>;
export type TypeOperatorUpdate = z.infer<typeof schemaOperatorUpdate>;

export class OperatorModel {
  private uuid: string;
  private operatorData: TypeOperator;

  constructor(props: TypeOperator) {
    const parsedData = schemaOperator.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.operatorData = {
      ...parsedData,
      uuid: this.uuid,
    };
  }

  setFirstName(firstName: string | null) {
    this.operatorData.firstName = firstName;
  }

  setLastName(lastName: string | null) {
    this.operatorData.lastName = lastName;
  }

  setEmail(email: string) {
    this.operatorData.email = email;
  }

  setEnabled(enabled: boolean) {
    this.operatorData.enabled = enabled;
  }

  async setPassword(password: string) {
    this.operatorData.password = await hashPassword(password);
  }

  setVerifyCode(otp: string | undefined) {
    this.operatorData.verifyCode = otp;
  }

  getData(): TypeOperator {
    return this.operatorData;
  }

  getUUID(): string {
    return this.uuid;
  }

  getOTP(): string | undefined {
    return this.operatorData.verifyCode;
  }

  getEmail(): string {
    return this.operatorData.email;
  }

  isValidOTP(otp: string): boolean {
    return this.operatorData.verifyCode === otp;
  }

  setLevel(level: number) {
    this.operatorData.level = level;
  }

  getLevel(): number {
    return this.operatorData.level;
  }

  async verifyPassword(password: string): Promise<boolean> {
    return verifyStoredPassword(password, this.operatorData.password);
  }

  toSafeData(): TypeSafeOperator {
    return {
      uuid: this.uuid,
      email: this.operatorData.email,
      firstName: this.operatorData.firstName,
      lastName: this.operatorData.lastName,
      enabled: this.operatorData.enabled,
      level: this.operatorData.level,
    };
  }

  static generateOTP(): string {
    return generateVerificationCode();
  }
}
