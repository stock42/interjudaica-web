import { z } from "zod";
import { createUuid, slugify } from "@/models/model-utils";

const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().email().optional(),
);

export const schemaInstructor = z.object({
  uuid: z.string().uuid().optional(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  displayName: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  email: optionalEmail,
  bio: z.string().trim().default(""),
  photoUrl: z.string().trim().default(""),
  enabled: z.coerce.boolean().default(true),
});

export type TypeInstructor = z.infer<typeof schemaInstructor>;

export class InstructorModel {
  private uuid: string;
  private instructorData: TypeInstructor;

  constructor(props: TypeInstructor) {
    const parsedData = schemaInstructor.parse(props);
    const displayName =
      parsedData.displayName?.trim() ||
      `${parsedData.firstName} ${parsedData.lastName}`.trim();

    this.uuid = parsedData.uuid ?? createUuid();
    this.instructorData = {
      ...parsedData,
      uuid: this.uuid,
      displayName,
      slug: slugify(displayName),
    };
  }

  getData(): TypeInstructor {
    return this.instructorData;
  }

  getUUID(): string {
    return this.uuid;
  }
}

