import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ButtonLink, PageShell, Section, SectionIntro } from "@/app/components/portal-ui";
import { listForumThreads } from "@/app/lib/forums";
import { getCurrentUser } from "@/services/user-auth";
import { SupportThreadForm } from "@/app/support/support-thread-form";

export const metadata: Metadata = {
	title: "Technical Support",
	description: "Get help from the InterJudaica support team.",
};

export const runtime = "nodejs";

export default async function SupportPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const user = await getCurrentUser();
	if (!user) {
		redirect("/login?next=/support");
	}

	const { page } = await searchParams;
	const pageNumber = Math.max(Number(page ?? "1"), 1);
	const forumResult = await listForumThreads({
		area: "Technical Support",
		page: pageNumber,
		limit: 10,
	});

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="Support"
					title="Technical support"
					text="Share your issue and the team will respond."
					actions={
						<ButtonLink href="/dashboard" tone="secondary">
							Back to dashboard
						</ButtonLink>
					}
				/>
				<div className="grid gap-4">
					<SupportThreadForm />
					{forumResult.items.length === 0 ? (
						<p className="text-sm text-[var(--muted)]">No threads yet.</p>
					) : (
						forumResult.items.map((thread) => (
							<article
								key={thread.uuid}
								className="rounded-lg border border-[var(--line)] bg-white p-5"
							>
								<p className="text-xs font-bold uppercase text-[var(--muted)]">
									{thread.area}
								</p>
								<h2 className="mt-2 font-display text-2xl font-semibold">
									{thread.title}
								</h2>
								{thread.content ? (
									<p className="mt-3 text-sm leading-6 text-[var(--muted)]">
										{thread.content}
									</p>
								) : null}
							</article>
						))
					)}
				</div>
				{forumResult.totalPages > 1 ? (
					<div className="mt-6 flex flex-wrap gap-3">
						{pageNumber > 1 ? (
							<ButtonLink href={`/support?page=${pageNumber - 1}`} tone="secondary">
								Previous
							</ButtonLink>
						) : null}
						{pageNumber < forumResult.totalPages ? (
							<ButtonLink href={`/support?page=${pageNumber + 1}`} tone="secondary">
								Next
							</ButtonLink>
						) : null}
					</div>
				) : null}
			</Section>
		</PageShell>
	);
}
