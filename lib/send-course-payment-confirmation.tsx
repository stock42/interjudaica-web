import "server-only";

import CoursePaymentConfirmationEmail from "@/templates/emails/course-payment-confirmation";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendCoursePaymentConfirmation({
	email,
	firstName,
	courseTitle,
	priceLabel,
}: {
	email: string;
	firstName: string;
	courseTitle: string;
	priceLabel: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();

	const result = await resend.emails.send({
		from,
		to: email,
		subject: `Payment confirmed: ${courseTitle}`,
		react: (
			<CoursePaymentConfirmationEmail
				firstName={firstName}
				courseTitle={courseTitle}
				priceLabel={priceLabel}
			/>
		),
	});

	return result.data;
}
