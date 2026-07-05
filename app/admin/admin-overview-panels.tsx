import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type OverviewSignal = {
	label: string;
	value: number;
	detail: string;
};

export type QuickAction = {
	href: string;
	title: string;
	text: string;
};

export function AdminOverviewPanels({
	signals,
	quickActions,
}: {
	signals: OverviewSignal[];
	quickActions: QuickAction[];
}) {
	return (
		<section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
			<Card className="rounded-lg border-[var(--line)] bg-[var(--surface)]">
				<CardHeader>
					<CardTitle>Operating signals</CardTitle>
					<CardDescription>
						Publishing and access indicators that need routine review.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					{signals.map((signal) => (
						<div key={signal.label} className="grid gap-2">
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm font-semibold text-[var(--ink)]">
									{signal.label}
								</span>
								<span className="text-sm tabular-nums text-[var(--gold)]">
									{signal.value}%
								</span>
							</div>
							<Progress value={signal.value} />
							<p className="text-xs text-[var(--muted)]">{signal.detail}</p>
						</div>
					))}
				</CardContent>
			</Card>

			<Card className="rounded-lg border-[var(--line)] bg-[var(--surface)]">
				<CardHeader>
					<CardTitle>Priority actions</CardTitle>
					<CardDescription>
						Common admin paths grouped around daily operations.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3">
					{quickActions.map((action) => (
						<Link
							key={action.href}
							href={action.href}
							className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 transition hover:bg-[rgba(244,189,51,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h2 className="text-sm font-semibold text-[var(--ink)]">
										{action.title}
									</h2>
									<p className="mt-2 text-xs leading-5 text-[var(--muted)]">
										{action.text}
									</p>
								</div>
								<Badge variant="outline">Open</Badge>
							</div>
						</Link>
					))}
				</CardContent>
			</Card>
		</section>
	);
}
