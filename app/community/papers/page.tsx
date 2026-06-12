import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { listCommunityPapers } from "@/app/lib/papers";
import { getCurrentUser } from "@/services/user-auth";
import { hasActiveCommunityMembership } from "@/services/community-memberships";

export const metadata: Metadata = {
  title: "Community Papers",
  description:
    "Member-only papers and essays from Ernesto Yattah for the InterJudaica community.",
};

export default async function CommunityPapersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/community/papers");
  }

  if (!(await hasActiveCommunityMembership(user))) {
    redirect("/community");
  }

  const papers = await listCommunityPapers();

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Member papers"
          title="Articles and source essays from Ernesto Yattah"
          text="Community members receive monthly essays, source packets, and short reflections connected to ongoing study."
          actions={
            <ButtonLink href="/community" tone="secondary">
              Membership
            </ButtonLink>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {papers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No papers published yet.</p>
          ) : (
            papers.map((paper) => (
              <article
                key={paper.uuid}
                className="rounded-lg border border-[var(--line)] bg-white p-5"
              >
                <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                  {paper.category}
                </p>
                <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">
                  {paper.title}
                </h2>
                <ButtonLink
                  href={`/community/papers/${paper.slug}`}
                  tone="secondary"
                  className="mt-4"
                >
                  Read paper
                </ButtonLink>
                <p className="mt-2 text-sm text-[var(--muted)]">{paper.date}</p>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {paper.summary}
                </p>
              </article>
            ))
          )}
        </div>
      </Section>
    </PageShell>
  );
}
