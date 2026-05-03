import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const userStatuses = ["active", "disabled", "pending"] as const;
export const communityStatuses = ["none", "active", "cancelled", "manual"] as const;

export const schemaUser = z.object({
  uuid: z.string().uuid().optional(),
  email: z.string().email().transform((email) => email.toLowerCase()),
  firstName: z.string().trim().default(""),
  lastName: z.string().trim().default(""),
  role: z.string().trim().default("student"),
  status: z.enum(userStatuses).default("active"),
  communityStatus: z.enum(communityStatuses).default("none"),
});

export type TypeUser = z.infer<typeof schemaUser>;

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
}

