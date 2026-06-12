import type { Metadata } from "next";

import { PageShell, Section, SectionIntro } from "@/app/components/portal-ui";
import { MarkdownRenderer } from "@/app/components/markdown-renderer";
import { getOwnerBio } from "@/app/lib/owner-bio";

export const runtime = "nodejs";

export const metadata: Metadata = {
	title: "Ernesto Yattah",
	description: "Meet Ernesto Yattah and explore his background and teaching philosophy.",
};

export default async function OwnerBioPage() {
	const bio = await getOwnerBio();

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="About"
					title={bio?.title || "Ernesto Yattah"}
					text="Learn about Ernesto Yattah, his background, and his mission at InterJudaica."
				/>
				<div className="rounded-lg border border-[var(--line)] bg-white p-6 text-[var(--ink)]">
					{bio?.markdown ? (
					<div className="prose max-w-none text-[var(--ink)]">
						<MarkdownRenderer content={bio.markdown} />
					</div>
				) : (
						<p className="text-sm text-[var(--muted)]">
							Bio content will be available soon.
						</p>
					)}
				</div>
			</Section>
		</PageShell>
	);
}
