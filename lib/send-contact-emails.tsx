import "server-only";

import ContactToAdminEmail from "@/templates/emails/contact-to-admin";
import ContactUserEmail from "@/templates/emails/contact-user";
import { getEmailFrom, getResend } from "@/lib/resend";

export type ContactPayload = {
  email: string;
  firstName: string;
  lastName: string;
  message: string;
};

const ADMIN_EMAIL = "eyatta@gmail.com";

export async function sendContactEmails(payload: ContactPayload) {
  const resend = getResend();
  const from = getEmailFrom();

  const { email, firstName, lastName, message } = payload;

  const adminResult = await resend.emails.send({
    from,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `InterJudaica contact: ${firstName} ${lastName}`,
    react: (
      <ContactToAdminEmail
        email={email}
        firstName={firstName}
        lastName={lastName}
        message={message}
      />
    ),
  });

  const userResult = await resend.emails.send({
    from,
    to: email,
    replyTo: ADMIN_EMAIL,
    subject: "We received your message — InterJudaica",
    react: (
      <ContactUserEmail
        firstName={firstName}
        lastName={lastName}
        message={message}
      />
    ),
  });

  return {
    admin: adminResult.data,
    user: userResult.data,
  };
}
