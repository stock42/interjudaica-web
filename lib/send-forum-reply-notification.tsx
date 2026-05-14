import "server-only";
import ForumReplyNotificationEmail from "@/templates/emails/forum-reply-notification";
import { getEmailFrom, getResend } from "@/lib/resend";

export async function sendForumReplyNotification({
	email,
	firstName,
	threadTitle,
	replyAuthor,
	replyPreview,
	forumUrl,
}: {
	email: string;
	firstName: string;
	threadTitle: string;
	replyAuthor: string;
	replyPreview: string;
	forumUrl: string;
}) {
	const resend = getResend();
	const from = getEmailFrom();
	return resend.emails.send({
		from,
		to: email,
		subject: `New reply: ${threadTitle}`,
		react: <ForumReplyNotificationEmail firstName={firstName} threadTitle={threadTitle} replyAuthor={replyAuthor} replyPreview={replyPreview} forumUrl={forumUrl} />,
	});
}
