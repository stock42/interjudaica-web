import { z } from "zod";
import { createUuid, linesToArray, slugify } from "@/models/model-utils";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;
export const publishingStatuses = ["draft", "published", "archived"] as const;

const lineArray = z.preprocess(linesToArray, z.array(z.string()));

export const schemaCourse = z.object({
  uuid: z.string().uuid().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(2),
  categoryUuid: z.string().uuid().optional().or(z.literal("")),
  category: z.string().trim().min(2),
  categorySlug: z.string().trim().default(""),
  level: z.enum(courseLevels).default("Beginner"),
  price: z.coerce.number().nonnegative().default(0),
  communityPrice: z.coerce.number().nonnegative().default(0),
  durationHours: z.coerce.number().nonnegative().default(0),
  startDate: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  imageLabel: z.string().trim().default("Course"),
  thumbnailImageUrl: z.string().trim().default(""),
  coverImageUrl: z.string().trim().default(""),
  accent: z.string().trim().default("#164a9f"),
  description: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  instructorUuid: z.string().uuid().optional().or(z.literal("")),
  instructor: z.string().trim().default("Rabbi Yattah"),
  instructorSlug: z.string().trim().default("rabbi-yattah"),
  video: z.string().trim().default("HD class recordings"),
  certificate: z.string().trim().default("Digital certificate included"),
  zoomLink: z.string().trim().default("Live Zoom access"),
  stripePaymentLink: z.string().trim().default(""),
  maxStudents: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(publishingStatuses).default("draft"),
  includes: lineArray.default([]),
  outcomes: lineArray.default([]),
});

export type TypeCourse = z.infer<typeof schemaCourse>;

export class CourseModel {
  private uuid: string;
  private courseData: TypeCourse;

  constructor(props: TypeCourse) {
    const parsedData = schemaCourse.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.courseData = {
      ...parsedData,
      uuid: this.uuid,
      slug: slugify(parsedData.title),
      categorySlug: parsedData.categorySlug || slugify(parsedData.category),
      instructorSlug: parsedData.instructorSlug || slugify(parsedData.instructor),
    };
  }

  getData(): TypeCourse {
    return this.courseData;
  }

  getUUID(): string {
    return this.uuid;
  }
}
