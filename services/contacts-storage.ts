import "server-only";

import { ContactModel, type TypeContact } from "@/models/contacts";
import { MongoDBStorage } from "@/services/MongoDBStorage";

export class ContactStorage extends MongoDBStorage<TypeContact> {
	static readonly COLLECTION = "contacts";
	private static indexesReady = false;

	constructor() {
		super(ContactStorage.COLLECTION);
	}

	static async ensureIndexes() {
		if (ContactStorage.indexesReady) {
			return;
		}

		const collection = await MongoDBStorage.getCollection<TypeContact>(
			ContactStorage.COLLECTION,
		);

		await Promise.all([
			collection.createIndex({ uuid: 1 }, { unique: true }),
			collection.createIndex({ "data.status": 1, _added: -1 }),
			collection.createIndex({ "data.email": 1 }),
		]);

		ContactStorage.indexesReady = true;
	}

	static async list() {
		await ContactStorage.ensureIndexes();
		const docs = await MongoDBStorage._find<TypeContact>(
			ContactStorage.COLLECTION,
			{},
			undefined,
			{ _added: -1 },
		);

		return docs.map((doc) => doc.data);
	}

	static async get(uuid: string) {
		await ContactStorage.ensureIndexes();
		const doc = await MongoDBStorage._getByUUID<TypeContact>(
			ContactStorage.COLLECTION,
			uuid,
		);

		return doc?.data ?? null;
	}

	static async create(input: Partial<TypeContact>) {
		await ContactStorage.ensureIndexes();
		const contact = new ContactModel({
			status: "new",
			createdAt: new Date().toISOString(),
			...input,
		} as TypeContact);
		await MongoDBStorage._insert<TypeContact>(
			ContactStorage.COLLECTION,
			contact,
		);
		return contact.getData();
	}

	static async markReplied(
		uuid: string,
		payload: { replySubject: string; replyMessage: string },
	) {
		await ContactStorage.ensureIndexes();
		return MongoDBStorage._update<TypeContact>(
			ContactStorage.COLLECTION,
			{ "data.uuid": uuid },
			{
				status: "replied",
				repliedAt: new Date().toISOString(),
				replySubject: payload.replySubject,
				replyMessage: payload.replyMessage,
			},
			{ upsert: false },
		);
	}

	static async markUnread(uuid: string) {
		await ContactStorage.ensureIndexes();
		return MongoDBStorage._update<TypeContact>(
			ContactStorage.COLLECTION,
			{ "data.uuid": uuid },
			{
				status: "new",
				repliedAt: "",
				replySubject: "",
				replyMessage: "",
			},
			{ upsert: false },
		);
	}
}
