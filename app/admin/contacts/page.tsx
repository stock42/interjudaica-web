import type { Metadata } from "next";
import { AdminShell } from "@/app/components/portal-ui";
import { ContactStorage } from "@/services/contacts-storage";
import { ContactList } from "@/app/admin/contacts/contact-list";

export const metadata: Metadata = {
	title: "Contacts",
	description: "Review and respond to contact form messages.",
};

export const runtime = "nodejs";

export default async function ContactsPage() {
	const contacts = await ContactStorage.list();

	return (
		<AdminShell
			title="Contacts"
			description="Review incoming messages and reply by email."
		>
			<ContactList contacts={contacts} />
		</AdminShell>
	);
}
