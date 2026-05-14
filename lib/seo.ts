import type { Metadata } from "next";

export function buildPageMetadata({
	title,
	description,
	url,
	imageUrl,
}: {
	title: string;
	description: string;
	url?: string;
	imageUrl?: string;
}): Metadata {
	const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://interjudaica.com";
	const fullUrl = url ? `${base}${url}` : base;
	const image = imageUrl ?? `${base}/logo-interjudaica.png`;

	return {
		title,
		description,
		metadataBase: new URL(base),
		openGraph: {
			title,
			description,
			url: fullUrl,
			siteName: "InterJudaica",
			images: [{ url: image, width: 1200, height: 630 }],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [image],
		},
	};
}
