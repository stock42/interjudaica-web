import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";

export const schemaPaperCategory = z.object({
  uuid: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  enabled: z.coerce.boolean().default(true),
});

export type TypePaperCategory = z.infer<typeof schemaPaperCategory>;

export class PaperCategoryModel {
  private uuid: string;
  private categoryData: TypePaperCategory;

  constructor(props: TypePaperCategory) {
    const parsedData = schemaPaperCategory.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.categoryData = {
      ...parsedData,
      uuid: this.uuid,
      slug: slugify(parsedData.name),
    };
  }

  getData(): TypePaperCategory {
    return this.categoryData;
  }

  getUUID(): string {
    return this.uuid;
  }
}
