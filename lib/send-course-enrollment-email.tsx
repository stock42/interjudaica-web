import "server-only";
import CourseEnrollmentEmail from "@/templates/emails/course-enrollment";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendCourseEnrollmentEmail({
	email,
	firstName,
	courseTitle,
	startDate,
	zoomLink,
}: {
	email: string;
	firstName: string;
	courseTitle: string;
	startDate?: string;
	zoomLink?: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();
	return resend.emails.send({
		from,
		to: email,
		subject: `You are enrolled: ${courseTitle}`,
		react: <CourseEnrollmentEmail firstName={firstName} courseTitle={courseTitle} startDate={startDate} zoomLink={zoomLink} />,
	});
}
