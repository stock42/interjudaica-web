import { OperatorStorage } from "@/services/operators-storage";
import { UserStorage } from "@/services/users-storage";

export async function Boot() {
  await UserStorage.ensureIndexes();
  await OperatorStorage.ensureDefaultOperator();
}
