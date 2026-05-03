import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";
import { publishingStatuses } from "@/models/courses";

export const paperVisibilities = ["public", "community", "private"] as const;

export const schemaPaper = z.object({
  uuid: z.string().uuid().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(2),
  category: z.string().trim().min(2),
  date: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  content: z.string().trim().default(""),
  author: z.string().trim().default("Rabbi Yattah"),
  status: z.enum(publishingStatuses).default("draft"),
  visibility: z.enum(paperVisibilities).default("community"),
});

export type TypePaper = z.infer<typeof schemaPaper>;

export class PaperModel {
  private uuid: string;
  private paperData: TypePaper;

  constructor(props: TypePaper) {
    const parsedData = schemaPaper.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.paperData = {
      ...parsedData,
      uuid: this.uuid,
      slug: parsedData.slug?.trim() || slugify(parsedData.title),
    };
  }

  getData(): TypePaper {
    return this.paperData;
  }

  getUUID(): string {
    return this.uuid;
  }
}

