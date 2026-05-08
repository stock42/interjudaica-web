import type { Metadata } from "next";

import { PageShell, Section, SectionIntro } from "@/app/components/portal-ui";
import { listForumThreads } from "@/app/lib/forums";

export const metadata: Metadata = {
	title: "Forum",
	description: "InterJudaica announcements and updates.",
};

export const runtime = "nodejs";

export default async function ForumPage() {
	const threads = await listForumThreads({ area: "Announcements" });

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="Forum"
					title="Announcements"
					text="Read announcements from InterJudaica. Discussion is read-only."
				/>
				<div className="grid gap-4">
					{threads.length === 0 ? (
						<p className="text-sm text-[var(--muted)]">
							No announcements yet.
						</p>
					) : (
						threads.map((thread) => (
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
			</Section>
		</PageShell>
	);
}
