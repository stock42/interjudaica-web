import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ContactStorage } from "@/services/contacts-storage";
import { sendContactReply } from "@/lib/send-contact-reply";
import { requireAdminApi } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaReply = z.object({
	subject: z.string().trim().min(1),
	message: z.string().trim().min(1).max(5000),
});

const maxAttachmentSize = 5 * 1024 * 1024;
const maxAttachmentCount = 5;

async function parseForm(request: NextRequest) {
	const formData = await request.formData();
	const subject = String(formData.get("subject") ?? "");
	const message = String(formData.get("message") ?? "");
	const files = formData.getAll("files");
	return { subject, message, files };
}

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
		const form = await parseForm(request);
		const parsed = schemaReply.safeParse({
			subject: form.subject,
			message: form.message,
		});

		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const payload = parsed.data;
		const contact = await ContactStorage.get(uuid);

		if (!contact) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const attachments = [] as { filename: string; content: string; type?: string }[];
		for (const file of form.files) {
			if (!(file instanceof File)) {
				continue;
			}
			if (attachments.length >= maxAttachmentCount) {
				break;
			}
			if (file.size > maxAttachmentSize) {
				return NextResponse.json(
					{ error: "Attachment must be smaller than 5 MB" },
					{ status: 400 },
				);
			}
			const buffer = Buffer.from(await file.arrayBuffer());
			attachments.push({
				filename: file.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "attachment",
				content: buffer.toString("base64"),
				type: file.type || undefined,
			});
		}

		await sendContactReply({
			email: contact.email,
			firstName: contact.firstName,
			lastName: contact.lastName,
			subject: payload.subject,
			replyMessage: payload.message,
			attachments,
		});

		await ContactStorage.markReplied(uuid, {
			replySubject: payload.subject,
			replyMessage: payload.message,
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Contact reply error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
