import "server-only";

import PasswordResetCodeEmail from "@/templates/emails/password-reset-code";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendPasswordResetCode({
	email,
	firstName,
	code,
}: {
	email: string;
	firstName: string;
	code: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();

	const result = await resend.emails.send({
		from,
		to: email,
		subject: "Your InterJudaica password reset code",
		react: <PasswordResetCodeEmail firstName={firstName} code={code} />,
	});

	return result.data;
}
