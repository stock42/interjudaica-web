import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ContactStorage } from "@/services/contacts-storage";
import { sendContactReply } from "@/lib/send-contact-reply";
import { readJson, requireAdminApi, routeError } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaReply = z.object({
	subject: z.string().trim().min(1),
	message: z.string().trim().min(1).max(5000),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ uuid: string }> },
) {
	const auth = await requireAdminApi(request);
	if ("response" in auth) {
		return auth.response;
	}

	try {
		const { uuid } = await params;
		const payload = schemaReply.parse(await readJson(request));
		const contact = await ContactStorage.get(uuid);

		if (!contact) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		await sendContactReply({
			email: contact.email,
			firstName: contact.firstName,
			lastName: contact.lastName,
			subject: payload.subject,
			replyMessage: payload.message,
		});

		await ContactStorage.markReplied(uuid, {
			replySubject: payload.subject,
			replyMessage: payload.message,
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		return routeError(error);
	}
}
