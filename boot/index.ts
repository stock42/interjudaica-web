import { OperatorStorage } from "@/services/operators-storage";
import { UserStorage } from "@/services/users-storage";
import { CourseClassStorage } from "@/services/course-classes-storage";
import { CourseClassFileStorage } from "@/services/course-class-files-storage";
import { CourseEnrollmentStorage } from "@/services/course-enrollments-storage";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { ContactStorage } from "@/services/contacts-storage";
import { PasswordResetAttemptStorage } from "@/services/password-reset-attempts-storage";
import { RabbiBioStorage } from "@/services/rabbi-bio-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";
import { ForumStorage } from "@/services/forums-storage";
import { CouponStorage } from "@/services/coupons-storage";
import { BookStorage } from "@/services/books-storage";
import { BookSaleStorage } from "@/services/book-sales-storage";

export async function Boot() {
  await UserStorage.ensureIndexes();
  await CourseClassStorage.ensureIndexes();
  await CourseClassFileStorage.ensureIndexes();
  await CourseEnrollmentStorage.ensureIndexes();
  await CoursePaymentStorage.ensureIndexes();
  await ContactStorage.ensureIndexes();
  await PasswordResetAttemptStorage.ensureIndexes();
  await RabbiBioStorage.ensureIndexes();
  await CommunityUserStorage.ensureIndexes();
  await CouponStorage.ensureIndexes();
  await BookStorage.ensureIndexes();
  await BookSaleStorage.ensureIndexes();
  await ForumStorage.ensureSystemThreads();
  await OperatorStorage.ensureDefaultOperator();
}
