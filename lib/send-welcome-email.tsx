import "server-only";

import WelcomeStudentEmail from "@/templates/emails/welcome-student";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendWelcomeEmail({
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
		subject: "Welcome to InterJudaica",
		react: <WelcomeStudentEmail firstName={firstName} />,
	});

	return result.data;
}
