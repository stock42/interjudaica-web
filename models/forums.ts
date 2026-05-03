import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";

export const forumStatuses = ["open", "closed", "hidden"] as const;

export const schemaForumThread = z.object({
  uuid: z.string().uuid().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(2),
  area: z.string().trim().min(2),
  courseSlug: z.string().trim().optional().or(z.literal("")),
  status: z.enum(forumStatuses).default("open"),
  featured: z.coerce.boolean().default(false),
  repliesCount: z.coerce.number().int().nonnegative().default(0),
  unreadCount: z.coerce.number().int().nonnegative().default(0),
  lastActivityAt: z.string().trim().default(""),
});

export type TypeForumThread = z.infer<typeof schemaForumThread>;

export class ForumThreadModel {
  private uuid: string;
  private threadData: TypeForumThread;

  constructor(props: TypeForumThread) {
    const parsedData = schemaForumThread.parse(props);
    this.uuid = parsedData.uuid ?? createUuid();
    this.threadData = {
      ...parsedData,
      uuid: this.uuid,
      slug: slugify(parsedData.title),
    };
  }

  getData(): TypeForumThread {
    return this.threadData;
  }

  getUUID(): string {
    return this.uuid;
  }
}
