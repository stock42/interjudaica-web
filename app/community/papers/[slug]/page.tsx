import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ButtonLink, PageShell, Section } from "@/app/components/portal-ui";
import { MarkdownRenderer } from "@/app/components/markdown-renderer";
import { getPaperBySlug } from "@/app/lib/papers";
import { hasActiveCommunityMembership } from "@/services/community-memberships";
import { getCurrentUser } from "@/services/user-auth";

export const runtime = "nodejs";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const paper = await getPaperBySlug(slug);

	return {
		title: paper?.title ?? "Paper",
	};
}

export default async function PaperDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect(`/login?next=/community/papers/${slug}`);
	}

	if (!(await hasActiveCommunityMembership(user))) {
		redirect("/community");
	}

	const paper = await getPaperBySlug(slug);

	if (!paper) {
		return (
			<PageShell>
				<Section tone="transparent">
					<p className="text-sm text-[var(--muted)]">Paper not found.</p>
				</Section>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<Section tone="transparent">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs font-bold uppercase text-[var(--sapphire)]">
							{paper.category}
						</p>
						<h1 className="mt-2 font-display text-3xl font-semibold">
							{paper.title}
						</h1>
						<p className="mt-1 text-sm text-[var(--muted)]">{paper.date}</p>
					</div>
					<ButtonLink href={`/api/papers/${paper.slug}/download`} tone="secondary">
						Download
					</ButtonLink>
				</div>

				<div className="prose max-w-none text-[var(--ink)]">
					<MarkdownRenderer content={paper.content || ""} />
				</div>
			</Section>
		</PageShell>
	);
}
