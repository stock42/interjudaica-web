import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/components/portal-ui";
import { ContactStorage } from "@/services/contacts-storage";
import { ContactReplyForm } from "@/app/admin/contacts/contact-reply-form";

export const metadata: Metadata = {
	title: "Contact detail",
	description: "Review and respond to a contact message.",
};

export const runtime = "nodejs";

export default async function ContactDetailPage({
	params,
}: {
	params: Promise<{ uuid: string }>;
}) {
	const { uuid } = await params;
	const contact = await ContactStorage.get(uuid);

	if (!contact) {
		notFound();
	}

	return (
		<AdminShell
			title="Contact message"
			description="Review the message and send an email response."
		>
			<ContactReplyForm contact={contact} />
		</AdminShell>
	);
}
