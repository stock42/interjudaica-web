import { OperatorStorage } from "@/services/operators-storage";

export async function Boot() {
  await OperatorStorage.ensureDefaultOperator();
}
