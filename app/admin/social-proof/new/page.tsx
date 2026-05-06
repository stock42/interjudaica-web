import type { Metadata } from "next";
import { AdminShell } from "@/app/components/portal-ui";
import { SocialProofForm } from "@/app/admin/social-proof/social-proof-form";

export const metadata: Metadata = {
  title: "New Testimonial",
  description: "Create a new social proof entry.",
};

export const runtime = "nodejs";

export default async function NewSocialProofPage() {
  return (
    <AdminShell
      title="New testimonial"
      description="Add a new testimonial to highlight student outcomes."
    >
      <SocialProofForm />
    </AdminShell>
  );
}
