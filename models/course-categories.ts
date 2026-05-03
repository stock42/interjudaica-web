import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";

export const schemaCourseCategory = z.object({
  uuid: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  enabled: z.coerce.boolean().default(true),
});

export type TypeCourseCategory = z.infer<typeof schemaCourseCategory>;

export class CourseCategoryModel {
  private uuid: string;
  private categoryData: TypeCourseCategory;

  constructor(props: TypeCourseCategory) {
    const parsedData = schemaCourseCategory.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.categoryData = {
      ...parsedData,
      uuid: this.uuid,
      slug: slugify(parsedData.name),
    };
  }

  getData(): TypeCourseCategory {
    return this.categoryData;
  }

  getUUID(): string {
    return this.uuid;
  }
}

