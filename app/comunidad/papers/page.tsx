import type { Metadata } from "next";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { papers } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Community Papers",
  description:
    "Member-only papers and essays from Rabbi Yattah for the InterJudaica community.",
};

export default function CommunityPapersPage() {
  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Member papers"
          title="Articles and source essays from Rabbi Yattah"
          text="Community members receive monthly essays, source packets, and short reflections connected to ongoing study."
          actions={
            <ButtonLink href="/comunidad" tone="secondary">
              Membership
            </ButtonLink>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {papers.map((paper) => (
            <article
              key={paper.title}
              className="rounded-lg border border-[var(--line)] bg-white p-5"
            >
              <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                {paper.category}
              </p>
              <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">
                {paper.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{paper.date}</p>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {paper.summary}
              </p>
              <ButtonLink href="#" tone="secondary" className="mt-6">
                Open paper
              </ButtonLink>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
