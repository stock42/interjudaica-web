import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";
import { publishingStatuses } from "@/models/courses";

export const paperVisibilities = ["public", "community", "private"] as const;

export const schemaPaper = z.object({
  uuid: z.string().uuid().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(2),
  categoryUuid: z.string().uuid().optional().or(z.literal("")),
  category: z.string().trim().default(""),
  categorySlug: z.string().trim().default(""),
  date: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  content: z.string().trim().default(""),
  author: z.string().trim().default("Ernesto Yattah"),
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
      slug: slugify(parsedData.title),
      categorySlug: parsedData.categorySlug || slugify(parsedData.category),
    };
  }

  getData(): TypePaper {
    return this.paperData;
  }

  getUUID(): string {
    return this.uuid;
  }
}
