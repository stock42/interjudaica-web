import { OperatorStorage } from "@/services/operators-storage";
import { UserStorage } from "@/services/users-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { ContactStorage } from "@/services/contacts-storage";

export async function Boot() {
  await UserStorage.ensureIndexes();
  await CourseClassStorage.ensureIndexes();
  await CourseClassFileStorage.ensureIndexes();
  await CourseEnrollmentStorage.ensureIndexes();
  await CoursePaymentStorage.ensureIndexes();
  await ContactStorage.ensureIndexes();
  await OperatorStorage.ensureDefaultOperator();
}
