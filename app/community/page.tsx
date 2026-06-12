import { Fragment } from "react";
import type { Metadata } from "next";
import {
  ButtonLink,
  InfoList,
  PageShell,
  Section,
  SectionIntro,
} from "@/app/components/portal-ui";
import { communityBenefits } from "@/app/lib/content";
import { listCommunityPapers } from "@/app/lib/papers";
import { getCurrentUser } from "@/services/user-auth";
import { hasActiveCommunityMembership } from "@/services/community-memberships";
import { SubscriptionPlanStorage } from "@/services/subscription-plans-storage";
import { CommunityUserStorage } from "@/services/community-users-storage";

function formatDescription(text: string) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the InterJudaica community for private forums, Ernesto Yattah papers, and member pricing on courses.",
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const isMember = user ? await hasActiveCommunityMembership(user) : false;
  const papers = isMember ? await listCommunityPapers() : [];
  const plans = await SubscriptionPlanStorage.list();
  const mostExpensivePlan =
    plans.length > 0
      ? plans.reduce((max, plan) => (plan.price > max.price ? plan : max), plans[0])
      : null
  const communityUser = user ? await CommunityUserStorage.getByUserUuid(user.uuid) : null;

  return (
    <PageShell>
      <Section tone="ink">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white/75">
              Community membership
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
              Study between courses
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Members get a private forum, monthly papers from Ernesto Yattah,
              course discounts, and early access to new cohorts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isMember ? (
                <ButtonLink href="/community/forum" tone="dark">
                  Community forum
                </ButtonLink>
              ) : mostExpensivePlan ? (
                <ButtonLink
                  href={`/checkout-community?planUuid=${mostExpensivePlan.uuid}`}
                  tone="dark"
                >
                  Subscribe
                </ButtonLink>
              ) : null}
              <ButtonLink
                href="/community/papers"
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
            {isMember ? (
              <>
                <p className="mt-2 text-white/65">You are a member</p>
                <div className="mt-6 h-px bg-white/15" />
                <p className="mt-6 text-sm leading-6 text-white/70">
                  Your subscription is active. Cancel anytime from your account.
                </p>
              </>
            ) : plans.length > 0 ? (
              <>
                <p className="mt-4 font-display text-6xl font-semibold">
                  ${plans[0].price / 100}
                </p>
                <p className="mt-2 text-white/65">
                  USD per {plans[0].billingInterval}
                </p>
                <div className="mt-6 h-px bg-white/15" />
                <p className="mt-6 text-sm leading-6 text-white/70">
                  {plans[0].description
                    ? formatDescription(plans[0].description)
                    : "Membership unlocks the private forum, papers, and course discounts."}
                </p>
              </>
            ) : (
              <>
                <div className="mt-6 h-px bg-white/15" />
                <p className="mt-6 text-sm leading-6 text-white/70">
                  No subscription plans available yet.
                </p>
              </>
            )}
          </div>
        </div>
      </Section>

      {!isMember && plans.length > 0 && (
        <Section tone="paper">
          <SectionIntro
            eyebrow="Plans"
            title="Choose your plan"
            text="Select the subscription plan that best fits your study."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.uuid}
                className="flex flex-col rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm"
              >
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {formatDescription(plan.description)}
                  </p>
                )}
                <p className="mt-4 font-display text-4xl font-semibold">
                  ${plan.price / 100}
                  <span className="text-base font-normal text-[var(--muted)]">
                    /{plan.billingInterval === "year" ? "year" : "month"}
                  </span>
                </p>
                <div className="mt-6 flex-1" />
                <ButtonLink
                  href={`/checkout-community?planUuid=${plan.uuid}`}
                  tone="dark"
                  className="w-full text-center"
                >
                  Subscribe
                </ButtonLink>
              </div>
            ))}
          </div>
        </Section>
      )}

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
            <SectionIntro eyebrow="Latest papers" title="Ernesto Yattah essays" />
            <div className="grid gap-4">
              {!isMember ? (
                <p className="text-sm text-[var(--muted)]">
                  Community members can access Ernesto Yattah papers after subscribing.
                </p>
              ) : papers.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No papers published yet.
                </p>
              ) : (
                papers.map((paper) => (
                  <article
                    key={paper.uuid}
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
                ))
              )}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
