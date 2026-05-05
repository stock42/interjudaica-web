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

export const schemaPublicCourse = z.object({
  slug: z.string().trim(),
  title: z.string().trim(),
  category: z.string().trim(),
  categorySlug: z.string().trim(),
  level: z.enum(courseLevels),
  price: z.number().nonnegative(),
  communityPrice: z.number().nonnegative(),
  duration: z.string().trim(),
  durationHours: z.number().nonnegative(),
  startDate: z.string().trim(),
  endDate: z.string().trim(),
  imageLabel: z.string().trim(),
  thumbnailImageUrl: z.string().trim(),
  coverImageUrl: z.string().trim(),
  accent: z.string().trim(),
  description: z.string().trim(),
  summary: z.string().trim(),
  instructor: z.string().trim(),
  instructorSlug: z.string().trim(),
  video: z.string().trim(),
  certificate: z.string().trim(),
  zoomLink: z.string().trim(),
  stripePaymentLink: z.string().trim(),
  maxStudents: z.number().int().nonnegative(),
  includes: z.array(z.string()),
  outcomes: z.array(z.string()),
});

export type TypePublicCourse = z.infer<typeof schemaPublicCourse>;

function formatDuration(hours: number) {
  if (hours <= 0) {
    return "Self-paced";
  }

  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function toPublicCourse(course: TypeCourse): TypePublicCourse {
  const parsedCourse = schemaCourse.parse(course);

  return schemaPublicCourse.parse({
    slug: parsedCourse.slug || slugify(parsedCourse.title),
    title: parsedCourse.title,
    category: parsedCourse.category,
    categorySlug: parsedCourse.categorySlug || slugify(parsedCourse.category),
    level: parsedCourse.level,
    price: parsedCourse.price,
    communityPrice: parsedCourse.communityPrice,
    duration: formatDuration(parsedCourse.durationHours),
    durationHours: parsedCourse.durationHours,
    startDate: parsedCourse.startDate,
    endDate: parsedCourse.endDate,
    imageLabel: parsedCourse.imageLabel,
    thumbnailImageUrl: parsedCourse.thumbnailImageUrl,
    coverImageUrl: parsedCourse.coverImageUrl,
    accent: parsedCourse.accent,
    description: parsedCourse.description,
    summary: parsedCourse.summary,
    instructor: parsedCourse.instructor,
    instructorSlug: parsedCourse.instructorSlug || slugify(parsedCourse.instructor),
    video: parsedCourse.video,
    certificate: parsedCourse.certificate,
    zoomLink: parsedCourse.zoomLink,
    stripePaymentLink: parsedCourse.stripePaymentLink,
    maxStudents: parsedCourse.maxStudents,
    includes: parsedCourse.includes,
    outcomes: parsedCourse.outcomes,
  });
}

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
