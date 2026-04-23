import type { Metadata } from "next";
import {
  ButtonLink,
  InfoList,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { communityBenefits, papers } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the InterJudaica community for private forums, Rabbi Yattah papers, and member pricing on courses.",
};

export default function CommunityPage() {
  return (
    <PageShell>
      <Section tone="ink">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white/75">
              Community membership
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
              Study between courses for $19 USD/month
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Members get a private forum, monthly papers from Rabbi Yattah,
              course discounts, and early access to new cohorts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#" tone="dark">
                Subscribe
              </ButtonLink>
              <ButtonLink
                href="/comunidad/papers"
                tone="quiet"
                className="text-white hover:bg-white/10"
              >
                View papers
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-sm font-bold uppercase text-white/60">
              Membership
            </p>
            <p className="mt-4 font-display text-6xl font-semibold">$19</p>
            <p className="mt-2 text-white/65">USD per month</p>
            <div className="mt-6 h-px bg-white/15" />
            <p className="mt-6 text-sm leading-6 text-white/70">
              Membership unlocks the private forum, papers, and course
              discounts for as long as the subscription remains active.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionIntro
              eyebrow="Benefits"
              title="A private layer for ongoing learning"
              text="Community is designed for students who want more than a course library: questions, discussion, papers, and recurring contact with the material."
            />
            <InfoList items={communityBenefits} />
          </div>
          <div>
            <SectionIntro eyebrow="Latest papers" title="Rabbi Yattah essays" />
            <div className="grid gap-4">
              {papers.map((paper) => (
                <article
                  key={paper.title}
                  className="rounded-lg border border-[var(--line)] bg-white p-5"
                >
                  <p className="text-xs font-bold uppercase text-[var(--sapphire)]">
                    {paper.category} / {paper.date}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-semibold">
                    {paper.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {paper.summary}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
