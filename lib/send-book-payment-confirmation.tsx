import "server-only";

import BookPaymentConfirmationEmail from "@/templates/emails/book-payment-confirmation";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendBookPaymentConfirmation({
	email,
	firstName,
	bookTitle,
	priceLabel,
}: {
	email: string;
	firstName: string;
	bookTitle: string;
	priceLabel: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();

	const result = await resend.emails.send({
		from,
		to: email,
		subject: `Thank you for your purchase: ${bookTitle}`,
		react: (
			<BookPaymentConfirmationEmail
				firstName={firstName}
				bookTitle={bookTitle}
				priceLabel={priceLabel}
			/>
		),
	});

	return result.data;
}
