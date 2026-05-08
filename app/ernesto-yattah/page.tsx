import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { PageShell, Section, SectionIntro } from "@/app/components/portal-ui";
import { getRabbiBio } from "@/app/lib/rabbi-bio";

export const runtime = "nodejs";

export const metadata: Metadata = {
	title: "Rabbi Ernesto Yattah",
	description: "Meet Rabbi Ernesto Yattah and explore his background and teaching philosophy.",
};

export default async function RabbiBioPage() {
	const bio = await getRabbiBio();

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="Rabbi"
					title={bio?.title || "Rabbi Ernesto Yattah"}
					text="Learn about Rabbi Ernesto Yattah, his background, and his mission at InterJudaica."
				/>
				<div className="rounded-lg border border-[var(--line)] bg-white p-6 text-[var(--ink)]">
					{bio?.markdown ? (
						<div className="prose max-w-none text-[var(--ink)]">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								rehypePlugins={[rehypeSanitize]}
							>
								{bio.markdown}
							</ReactMarkdown>
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
