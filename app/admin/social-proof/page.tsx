import type { Metadata } from "next";
import { AdminShell } from "@/app/components/portal-ui";
import { SocialProofList } from "@/app/admin/social-proof/social-proof-list";
import { SocialProofStorage } from "@/services/social-proof-storage";

export const metadata: Metadata = {
  title: "Social Proof",
  description: "Manage InterJudaica testimonials and social proof entries.",
};

export const runtime = "nodejs";

export default async function SocialProofPage() {
  const items = await SocialProofStorage.list();

  return (
    <AdminShell
      title="Social proof"
      description="Create, edit, and publish student testimonials for the homepage."
    >
      <SocialProofList items={items} />
    </AdminShell>
  );
}
