import type { Metadata } from "next";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { forumThreads } from "@/app/lib/content";

export const metadata: Metadata = {
  title: "Community Forum",
  description:
    "Private InterJudaica community forum for member discussions and Rabbi Yattah papers.",
};

export default function CommunityForumPage() {
  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Forum"
          title="Community discussion"
          text="Members can follow ongoing questions, paper discussions, course reflections, and replies from Rabbi Yattah."
          actions={
            <ButtonLink href="/comunidad" tone="secondary">
              Membership
            </ButtonLink>
          }
        />
        <div className="grid gap-4">
          {forumThreads.map((thread) => (
            <article
              key={thread.title}
              className="rounded-lg border border-[var(--line)] bg-white p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-[var(--muted)]">
                    {thread.area}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">
                    {thread.title}
                  </h2>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="rounded-full bg-[var(--paper)] px-3 py-1">
                    {thread.replies} replies
                  </span>
                  <span className="rounded-full bg-[rgba(22,74,159,0.1)] px-3 py-1 text-[var(--sapphire)]">
                    {thread.unread} unread
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-l border-[var(--line)] pl-4">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Rachel B.: I am trying to connect the paper&apos;s argument to
                  last week&apos;s class on prayer language.
                </p>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Rabbi Yattah: Start with the repeated phrase and ask what
                  habit it trains before asking what idea it proves.
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
