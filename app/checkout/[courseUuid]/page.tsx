import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthPanel } from "@/app/components/portal-ui";
import { CourseStorage } from "@/services/courses-storage";
import { getCurrentUser } from "@/services/user-auth";
import { CheckoutForm } from "@/app/checkout/checkout-form";
import { formatUsd } from "@/app/lib/content";

export const metadata: Metadata = {
	title: "Checkout",
	description: "Complete your course enrollment.",
};

export const runtime = "nodejs";

export default async function CheckoutPage({
	params,
	searchParams,
}: {
	params: Promise<{ courseUuid: string }>;
	searchParams: Promise<{ payment?: string }>;
}) {
	const user = await getCurrentUser();
	const { courseUuid } = await params;
	const { payment } = await searchParams;

	if (!user) {
		redirect(`/login?next=/checkout/${courseUuid}`);
	}

	const course = await CourseStorage.get(courseUuid);
	if (!course) {
		notFound();
	}

	return (
		<AuthPanel
			title="Checkout"
			text="Complete your enrollment and unlock the full course content."
		>
			{payment === "cancelled" ? (
				<p className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
					Payment was cancelled. You can try again when you are ready.
				</p>
			) : null}
			<CheckoutForm course={course} priceLabel={formatUsd(course.price)} />
		</AuthPanel>
	);
}
