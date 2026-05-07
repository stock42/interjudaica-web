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
}: {
	params: Promise<{ courseUuid: string }>;
}) {
	const user = await getCurrentUser();
	const { courseUuid } = await params;

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
			<CheckoutForm course={course} priceLabel={formatUsd(course.price)} />
		</AuthPanel>
	);
}
