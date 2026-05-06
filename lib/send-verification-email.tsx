import "server-only";

import VerifyEmail from "@/templates/emails/verify-email";
import { getEmailFrom, getResend } from "@/lib/resend";

type VerificationPayload = {
	email: string;
	firstName: string;
	code: string;
};

export async function sendVerificationEmail(payload: VerificationPayload) {
	const resend = getResend();
	const from = getEmailFrom();
	const { email, firstName, code } = payload;

	return resend.emails.send({
		from,
		to: email,
		subject: "Your InterJudaica verification code",
		react: <VerifyEmail firstName={firstName} code={code} />,
	});
}
