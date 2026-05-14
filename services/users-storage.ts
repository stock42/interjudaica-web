import "server-only";

import { generateVerificationCode } from "@/models/model-utils";
import {
  UserModel,
  type TypeSafeUser,
  type TypeUser,
  type TypeUserSignup,
} from "@/models/users";
import { MongoDBStorage, type TypeDocument } from "@/services/MongoDBStorage";

export class UserStorage extends MongoDBStorage<TypeUser> {
  static readonly COLLECTION = "users";
  private static indexesReady = false;

  constructor() {
    super(UserStorage.COLLECTION);
  }

  static toSafeUser(document: TypeDocument<TypeUser>): TypeSafeUser {
    return {
      uuid: document.uuid,
      email: document.data.email,
      firstName: document.data.firstName,
      lastName: document.data.lastName,
      country: document.data.country,
      state: document.data.state,
      city: document.data.city,
      role: document.data.role,
      status: document.data.status,
      communityStatus: document.data.communityStatus,
    };
  }

  static async ensureIndexes() {
    if (UserStorage.indexesReady) {
      return;
    }

    const collection = await MongoDBStorage.getCollection<TypeUser>(
      UserStorage.COLLECTION,
    );

    await Promise.all([
      collection.createIndex({ uuid: 1 }, { unique: true }),
      collection.createIndex({ "data.email": 1 }, { unique: true }),
      collection.createIndex({ "data.status": 1, "data.communityStatus": 1 }),
    ]);

    try {
      await collection.createIndex({
        "data.email": "text",
        "data.firstName": "text",
        "data.lastName": "text",
        "data.country": "text",
        "data.state": "text",
        "data.city": "text",
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 85
      ) {
        // Ignore index option conflicts (existing text index)
      } else {
        throw error;
      }
    }

    UserStorage.indexesReady = true;
  }

  static async list() {
    await UserStorage.ensureIndexes();
    const docs = await MongoDBStorage._find<TypeUser>(
      UserStorage.COLLECTION,
      {},
      undefined,
      { _added: -1 },
    );

    return docs.map((doc) => UserStorage.toSafeUser(doc));
  }

  static async get(uuid: string) {
    await UserStorage.ensureIndexes();
    const doc = await MongoDBStorage._getByUUID<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
    );

    return doc ? UserStorage.toSafeUser(doc) : null;
  }

  static async create(input: Partial<TypeUser>) {
    await UserStorage.ensureIndexes();
    const user = new UserModel(input as TypeUser);
    await MongoDBStorage._insert<TypeUser>(UserStorage.COLLECTION, user);
    return user.toSafeData();
  }

  static async register(input: TypeUserSignup) {
    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = UserStorage.getVerificationExpiry();
    const user = new UserModel({
      ...input,
      password: "",
      role: "student",
      status: "pending",
      communityStatus: "none",
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: verificationExpiresAt,
      emailVerifiedAt: "",
      passwordResetCode: "",
      passwordResetExpiresAt: "",
      passwordResetAttempts: 0,
      passwordResetAttemptsWindowStart: "",
      passwordResetLockedUntil: "",
    });

    await user.setPassword(input.password);
    await MongoDBStorage._insert<TypeUser>(UserStorage.COLLECTION, user);
    return { user: user.toSafeData(), verificationCode };
  }

  static async update(uuid: string, input: Partial<TypeUser>) {
    await UserStorage.ensureIndexes();
    const existing = await MongoDBStorage._getByUUID<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
    );

    if (!existing) {
      return null;
    }

    const user = new UserModel({
      ...existing.data,
      ...input,
      uuid,
    });

    await MongoDBStorage._replaceData<TypeUser>(
      UserStorage.COLLECTION,
      uuid,
      user.getData(),
    );

    return user.toSafeData();
  }

  static async delete(uuid: string) {
    await UserStorage.ensureIndexes();
    return MongoDBStorage._delete(UserStorage.COLLECTION, uuid);
  }

  static async findByEmail(email: string) {
    return MongoDBStorage._findOne<TypeUser>(UserStorage.COLLECTION, {
      "data.email": email.toLowerCase(),
    });
  }

  static async findByUUID(uuid: string) {
    await UserStorage.ensureIndexes();
    return MongoDBStorage._getByUUID<TypeUser>(UserStorage.COLLECTION, uuid);
  }

  static async markEmailVerified(uuid: string) {
    await UserStorage.ensureIndexes();
    return UserStorage.update(uuid, {
      status: "active",
      emailVerifiedAt: new Date().toISOString(),
      emailVerificationCode: "",
      emailVerificationExpiresAt: "",
    });
  }

  static async verifyEmailCode(email: string, code: string) {
    await UserStorage.ensureIndexes();
    const document = await UserStorage.findByEmail(email);

    if (!document) {
      return { ok: false, error: "Email not found" } as const;
    }

    const { data } = document;
    if (data.status !== "pending") {
      return { ok: false, error: "Email already verified" } as const;
    }

    if (!data.emailVerificationCode || !data.emailVerificationExpiresAt) {
      return { ok: false, error: "Verification code expired" } as const;
    }

    if (data.emailVerificationCode !== code) {
      return { ok: false, error: "Invalid verification code" } as const;
    }

    if (Date.parse(data.emailVerificationExpiresAt) < Date.now()) {
      return { ok: false, error: "Verification code expired" } as const;
    }

    const updated = await UserStorage.markEmailVerified(document.uuid);
    return updated
      ? ({ ok: true, user: updated } as const)
      : ({ ok: false, error: "Unable to verify email" } as const);
  }

  static async regenerateVerificationCode(email: string) {
    await UserStorage.ensureIndexes();
    const document = await UserStorage.findByEmail(email);

    if (!document) {
      return { ok: false, error: "Email not found" } as const;
    }

    if (document.data.status !== "pending") {
      return { ok: false, error: "Email already verified" } as const;
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiresAt = UserStorage.getVerificationExpiry();

    await UserStorage.update(document.uuid, {
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: verificationExpiresAt,
    });

    return {
      ok: true,
      email: document.data.email,
      firstName: document.data.firstName,
      code: verificationCode,
    } as const;
  }

  static async authenticate(email: string, password: string) {
    const document = await UserStorage.findByEmail(email);

    if (!document || document.data.status !== "active") {
      return null;
    }

    const user = new UserModel(document.data);
    const validPassword = await user.verifyPassword(password);

    if (!validPassword) {
      return null;
    }

    return UserStorage.toSafeUser(document);
  }

  static async createPasswordResetCode(email: string) {
    await UserStorage.ensureIndexes();
    const document = await UserStorage.findByEmail(email);

    if (!document || document.data.status !== "active") {
      return { ok: false } as const;
    }

    const resetCode = generateVerificationCode();
    const resetExpiresAt = UserStorage.getResetExpiry();

    await UserStorage.update(document.uuid, {
      passwordResetCode: resetCode,
      passwordResetExpiresAt: resetExpiresAt,
      passwordResetAttempts: 0,
      passwordResetAttemptsWindowStart: "",
      passwordResetLockedUntil: "",
    });

    return {
      ok: true,
      email: document.data.email,
      firstName: document.data.firstName,
      code: resetCode,
    } as const;
  }

  static async verifyPasswordResetCode(email: string, code: string) {
    await UserStorage.ensureIndexes();
    const document = await UserStorage.findByEmail(email);

    if (!document || document.data.status !== "active") {
      return { ok: false, error: "Invalid email or code" } as const;
    }

    const { data } = document;
    const now = Date.now();
    const lockUntil = data.passwordResetLockedUntil
      ? Date.parse(data.passwordResetLockedUntil)
      : 0;

    if (lockUntil && lockUntil > now) {
      return { ok: false, error: "Too many attempts. Try again later." } as const;
    }

    if (!data.passwordResetCode || !data.passwordResetExpiresAt) {
      return { ok: false, error: "Reset code expired" } as const;
    }

    if (Date.parse(data.passwordResetExpiresAt) < now) {
      return { ok: false, error: "Reset code expired" } as const;
    }

    const windowStart = data.passwordResetAttemptsWindowStart
      ? Date.parse(data.passwordResetAttemptsWindowStart)
      : 0;
    const withinWindow = windowStart && now - windowStart <= UserStorage.getResetAttemptWindowMs();
    const attempts = withinWindow ? data.passwordResetAttempts : 0;

    if (data.passwordResetCode !== code) {
      const nextAttempts = attempts + 1;
      const lockSeconds = UserStorage.getResetAttemptLockSeconds();
      const shouldLock = nextAttempts >= UserStorage.getResetAttemptLimit();

      await UserStorage.update(document.uuid, {
        passwordResetAttempts: nextAttempts,
        passwordResetAttemptsWindowStart: withinWindow
          ? data.passwordResetAttemptsWindowStart
          : new Date(now).toISOString(),
        passwordResetLockedUntil: shouldLock
          ? new Date(now + lockSeconds * 1000).toISOString()
          : data.passwordResetLockedUntil,
      });

      return { ok: false, error: "Invalid email or code" } as const;
    }

    await UserStorage.update(document.uuid, {
      passwordResetAttempts: 0,
      passwordResetAttemptsWindowStart: "",
      passwordResetLockedUntil: "",
    });

    return { ok: true, user: document } as const;
  }

  static async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const result = await UserStorage.verifyPasswordResetCode(email, code);

    if (!result.ok) {
      return result;
    }

    const userModel = new UserModel(result.user.data);
    await userModel.setPassword(newPassword);

    await UserStorage.update(result.user.uuid, {
      password: userModel.getData().password,
      passwordChangedAt: new Date().toISOString(),
      passwordResetCode: "",
      passwordResetExpiresAt: "",
      passwordResetAttempts: 0,
      passwordResetAttemptsWindowStart: "",
      passwordResetLockedUntil: "",
    });

    return { ok: true, user: UserStorage.toSafeUser(result.user) } as const;
  }

  private static getVerificationExpiry() {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20);
    return expiresAt.toISOString();
  }

  private static getResetExpiry() {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
    return expiresAt.toISOString();
  }

  private static getResetAttemptLimit() {
    return Number(process.env.RESET_ATTEMPT_LIMIT ?? "5");
  }

  private static getResetAttemptWindowMs() {
    const seconds = Number(process.env.RESET_ATTEMPT_WINDOW_SECONDS ?? "900");
    return seconds * 1000;
  }

  private static getResetAttemptLockSeconds() {
    return Number(process.env.RESET_ATTEMPT_LOCK_SECONDS ?? "900");
  }
}
