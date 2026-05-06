import { z } from "zod";
import { createUuid } from "@/models/model-utils";

export const socialProofStatuses = ["draft", "published"] as const;

export const schemaSocialProof = z.object({
  uuid: z.string().uuid().optional(),
  quote: z.string().trim().min(4),
  name: z.string().trim().min(2),
  detail: z.string().trim().min(2),
  status: z.enum(socialProofStatuses).default("draft"),
  order: z.coerce.number().int().min(0).default(0),
});

export type TypeSocialProof = z.infer<typeof schemaSocialProof>;

export class SocialProofModel {
  private uuid: string;
  private proofData: TypeSocialProof;

  constructor(props: TypeSocialProof) {
    const parsedData = schemaSocialProof.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.proofData = {
      ...parsedData,
      uuid: this.uuid,
    };
  }

  getData(): TypeSocialProof {
    return this.proofData;
  }

  getUUID(): string {
    return this.uuid;
  }
}
