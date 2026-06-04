import type { Metadata } from "next";
import Image from "next/image";

import { PageShell, Section, SectionIntro } from "@/app/components/portal-ui";
import ContactForm from "@/app/contact/contact-form";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact InterJudaica. Send us a message and we will reply shortly.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <Section tone="transparent">
        <SectionIntro
          eyebrow="Contact"
          title="Send a message"
          text="Tell us what you are looking for and we will respond by email."
        />

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="rounded-lg border border-[var(--line)] bg-white p-6">
            <ContactForm />
          </div>

          <aside className="relative overflow-hidden rounded-lg border border-[rgba(244,189,51,0.4)] bg-[#050608] p-8 text-[#f8f2e8] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[rgba(244,189,51,0.25)]" />
            <div className="absolute -right-28 -top-36 h-96 w-96 rounded-full border border-[rgba(244,189,51,0.12)]" />

            <div className="relative">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo-interjudaica.png"
                  alt="InterJudaica logo"
                  width={256}
                  height={256}
                  className="h-16 w-16 rounded-full border border-[rgba(244,189,51,0.32)]"
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--gold)]">
                    InterJudaica
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold leading-none">
                    Contact us
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-md text-base leading-7 text-white/78">
                If you have questions about our courses, community membership,
                or scheduling, send us a message and we will reply as soon as
                possible.
              </p>

              <div className="mt-8 rounded-lg border border-[rgba(244,189,51,0.25)] bg-black/30 p-5">
                <p className="text-sm font-semibold text-[var(--gold)]">
                  Response time
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  We typically respond within 24–48 hours. Please avoid sending
                  sensitive personal information.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </PageShell>
  );
}
