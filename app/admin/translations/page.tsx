import type { Metadata } from "next";
import { TranslationEditor } from "@/app/admin/translations/translation-editor";
import { AdminShell } from "@/app/components/portal-ui";
import { TranslationStorage } from "@/services/translations-storage";

export const metadata: Metadata = {
	title: "Admin Translations",
	description: "Manage i18n translations for the platform.",
};

export const runtime = "nodejs";

export default async function AdminTranslationsPage() {
	const locales = await TranslationStorage.getLocales();

	return (
		<AdminShell
			title="Translations"
			description="Manage multilingual translations. English keys are the source of truth. Use the AI Assistant to auto-translate to new languages."
		>
			<TranslationEditor locales={locales} />
		</AdminShell>
	);
}
