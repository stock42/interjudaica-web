import type { Metadata } from "next";
import { AdminShell, DataTable } from "@/app/components/portal-ui";
import { CoursePaymentStorage } from "@/services/course-payments-storage";
import { UserStorage } from "@/services/users-storage";
import { CourseStorage } from "@/services/courses-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Admin Payments",
	description: "Manage InterJudaica Stripe transactions.",
};

export default async function AdminPaymentsPage() {
	const [payments, users, courses] = await Promise.all([
		CoursePaymentStorage.list(),
		UserStorage.list(),
		CourseStorage.list(),
	]);

	const userMap = new Map(users.map((u) => [u.uuid, u]));
	const courseMap = new Map(courses.map((c) => [c.uuid, c]));

	const rows = payments.map((p) => {
		const user = userMap.get(p.userUuid);
		const course = courseMap.get(p.courseUuid);
		const userName = user
			? `${user.firstName} ${user.lastName}`.trim() || user.email
			: p.userUuid;
		const typeLabel = course ? `Course: ${course.title}` : "Course";
		return [
			p.stripeSessionId || "free",
			userName,
			typeLabel,
			`$${(p.amount || 0).toFixed(2)} USD`,
			p.status || "pending",
			p.paidAt
				? new Date(p.paidAt).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})
				: p.createdAt
					? new Date(p.createdAt).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})
					: "-",
		];
	});

	return (
		<AdminShell
			title="Payments"
			description="Track one-time course purchases, recurring community subscriptions, refunds, and reconciliation notes."
		>
			<DataTable
				columns={["Payment", "User", "Type", "Amount", "Status", "Date"]}
				rows={rows.length ? rows : [[]]}
			/>
		</AdminShell>
	);
}
