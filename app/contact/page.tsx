import type { Metadata } from "next";

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

        <div className="max-w-2xl rounded-lg border border-[var(--line)] bg-white p-6">
          <ContactForm />
        </div>
      </Section>
    </PageShell>
  );
}
