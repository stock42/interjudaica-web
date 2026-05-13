import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageStorage } from "@/services/pages-storage";
import { MarkdownPage } from "@/app/page/markdown-page";

export const runtime = "nodejs";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = await PageStorage.findPublishedBySlug(slug);
	if (!page) {
		return { title: "Page not found" };
	}
	return {
		title: `${page.title} | InterJudaica`,
		description: page.description || `Read ${page.title}`,
	};
}

export default async function DynamicPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const page = await PageStorage.findPublishedBySlug(slug);

	if (!page) {
		notFound();
	}

	return <MarkdownPage page={page} />;
}
