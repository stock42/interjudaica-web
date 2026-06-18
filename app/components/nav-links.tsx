"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/app/lib/content";
import { MoreContentMenu } from "@/app/components/more-content-menu";
import type { TypePage } from "@/models/pages";

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks({ pages }: { pages: TypePage[] }) {
	const pathname = usePathname();

	return (
		<>
			{navItems.map((item) => {
				const active = isActive(pathname, item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={`shrink-0 border-b-2 px-1 py-2 text-base font-medium transition ${
							active
								? "border-[var(--gold)] text-[var(--gold)]"
								: "border-transparent text-[rgba(248,242,232,0.9)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
						}`}
					>
						{item.label}
					</Link>
				);
			})}
			<MoreContentMenu pages={pages} />
		</>
	);
}
