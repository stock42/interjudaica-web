import Link from "next/link";

type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.label,
			item: item.href ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://interjudaica.com"}${item.href}` : undefined,
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<nav aria-label="Breadcrumb" className="py-3">
				<ol className="flex flex-wrap items-center gap-1 text-sm">
					{items.map((item, i) => (
						<li key={i} className="flex items-center gap-1">
							{i > 0 ? (
								<span className="text-[var(--muted)] select-none">/</span>
							) : null}
							{item.href && i < items.length - 1 ? (
								<Link
									href={item.href}
									className="font-semibold text-[var(--sapphire)] transition hover:underline"
								>
									{item.label}
								</Link>
							) : (
								<span className="font-semibold text-[var(--ink)]">
									{item.label}
								</span>
							)}
						</li>
					))}
				</ol>
			</nav>
		</>
	);
}
