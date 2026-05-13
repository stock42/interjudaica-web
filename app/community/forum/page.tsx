import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ButtonLink,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { listForumThreads } from "@/app/lib/forums";
import { getCurrentUser } from "@/services/user-auth";
import { CommunityThreadForm } from "@/app/community/forum/forum-form";

export const metadata: Metadata = {
  title: "Community Forum",
  description:
    "Private InterJudaica community forum for member discussions and Rabbi Yattah papers.",
};

export default async function CommunityForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/community/foro");
  }

  if (user.communityStatus !== "active") {
    redirect("/community");
  }

  const { page } = await searchParams;
  const pageNumber = Math.max(Number(page ?? "1"), 1);
  const forumResult = await listForumThreads({
    area: "Community Forum",
    page: pageNumber,
    limit: 10,
  });

  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Forum"
          title="Community discussion"
          text="Members can follow ongoing questions, paper discussions, course reflections, and replies from Rabbi Yattah."
          actions={
            <ButtonLink href="/community" tone="secondary">
              Membership
            </ButtonLink>
          }
        />
        <div className="grid gap-4">
          <CommunityThreadForm />
          {forumResult.items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No threads yet.</p>
          ) : (
            forumResult.items.map((thread) => (
              <article
                key={thread.uuid}
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
                      {thread.repliesCount ?? 0} replies
                    </span>
                    <span className="rounded-full bg-[rgba(22,74,159,0.1)] px-3 py-1 text-[var(--sapphire)]">
                      {thread.unreadCount ?? 0} unread
                    </span>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 border-l border-[var(--line)] pl-4">
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    {thread.content || ""}
                  </p>
                  {thread.imageUrls?.length ? (
                    <div className="grid gap-2">
                      {thread.imageUrls.map((url) => (
                        <Image
                          key={url}
                          src={url}
                          alt="Thread attachment"
                          width={960}
                          height={540}
                          className="max-w-full rounded-lg border border-[var(--line)]"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
        {forumResult.totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {pageNumber > 1 ? (
              <ButtonLink
                href={`/community/foro?page=${pageNumber - 1}`}
                tone="secondary"
              >
                Previous
              </ButtonLink>
            ) : null}
            {pageNumber < forumResult.totalPages ? (
              <ButtonLink
                href={`/community/foro?page=${pageNumber + 1}`}
                tone="secondary"
              >
                Next
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
      </Section>
    </PageShell>
  );
}
