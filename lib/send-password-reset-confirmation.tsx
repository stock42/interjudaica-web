import "server-only";

import PasswordResetConfirmationEmail from "@/templates/emails/password-reset-confirmation";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendPasswordResetConfirmation({
	email,
	firstName,
}: {
	email: string;
	firstName: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();

	const result = await resend.emails.send({
		from,
		to: email,
		subject: "Your InterJudaica password was updated",
		react: <PasswordResetConfirmationEmail firstName={firstName} />,
	});

	return result.data;
}
