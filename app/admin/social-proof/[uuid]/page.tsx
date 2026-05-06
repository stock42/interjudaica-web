import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/components/portal-ui";
import { SocialProofForm } from "@/app/admin/social-proof/social-proof-form";
import { SocialProofStorage } from "@/services/social-proof-storage";

export const metadata: Metadata = {
  title: "Edit Testimonial",
  description: "Edit a social proof entry.",
};

export const runtime = "nodejs";

export default async function EditSocialProofPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const item = await SocialProofStorage.get(uuid);

  if (!item) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit testimonial"
      description="Update the quote, attribution, and status."
    >
      <SocialProofForm item={item} />
    </AdminShell>
  );
}
