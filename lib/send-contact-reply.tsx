import "server-only";

import ContactReplyEmail from "@/templates/emails/contact-reply";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendContactReply({
	email,
	firstName,
	lastName,
	subject,
	replyMessage,
}: {
	email: string;
	firstName: string;
	lastName: string;
	subject: string;
	replyMessage: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();

	const result = await resend.emails.send({
		from,
		to: email,
		subject,
		react: (
			<ContactReplyEmail
				firstName={firstName}
				lastName={lastName}
				replyMessage={replyMessage}
			/>
		),
	});

	return result.data;
}
