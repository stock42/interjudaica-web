'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	LayoutDashboard,
	BookOpen,
	FileText,
	Users,
	DollarSign,
	Settings,
	ChevronRight,
	Mail,
	Bot,
	MessageSquare,
	Search,
	Contact,
	Send,
} from 'lucide-react'
import { useAdminChat } from '@/app/admin/components/admin-layout-client'
import type { ComponentType } from 'react'

interface NavLink {
	href: string
	label: string
}

interface NavSubGroup {
	label: string
	icon: ComponentType<{ className?: string }>
	links: NavLink[]
}

interface NavGroup {
	label: string
	icon: ComponentType<{ className?: string }>
	links: NavLink[]
	subGroups?: NavSubGroup[]
}

const navGroups: NavGroup[] = [
	{
		label: 'Dashboard',
		icon: LayoutDashboard,
		links: [{ href: '/admin', label: 'Dashboard' }],
	},
	{
		label: 'Courses',
		icon: BookOpen,
		links: [
			{ href: '/admin/courses', label: 'Courses' },
			{ href: '/admin/course-categories', label: 'Course Categories' },
			{ href: '/admin/instructors', label: 'Instructors' },
		],
	},
	{
		label: 'Content',
		icon: FileText,
		links: [
			{ href: '/admin/papers', label: 'Papers' },
			{ href: '/admin/paper-categories', label: 'Paper Categories' },
			{ href: '/admin/pages', label: 'Pages' },
			{ href: '/admin/translations', label: 'Translations' },
			{ href: '/admin/social-proof', label: 'Testimonials' },
			{ href: '/admin/owner-bio', label: 'Owner Biography' },
		],
	},
	{
		label: 'Users',
		icon: Users,
		links: [
			{ href: '/admin/users', label: 'Users' },
			{ href: '/admin/operators', label: 'Operators' },
			{ href: '/admin/community-users', label: 'Community Access' },
			{ href: '/admin/password-resets', label: 'Password Resets' },
		],
	},
	{
		label: 'Sales',
		icon: DollarSign,
		links: [
			{ href: '/admin/subscription-plans', label: 'Subscription Plans' },
			{ href: '/admin/subscriptions', label: 'Subscriptions' },
			{ href: '/admin/payments', label: 'Payments' },
			{ href: '/admin/books', label: 'Books' },
			{ href: '/admin/book-sales', label: 'Book Sales' },
			{ href: '/admin/coupons', label: 'Coupons' },
			{ href: '/admin/enrollments', label: 'Enrollments' },
		],
	},
	{
		label: 'Forum',
		icon: MessageSquare,
		links: [
			{ href: '/admin/forum', label: 'Forum' },
			{ href: '/admin/moderation', label: 'Moderation Queue' },
		],
	},
	{
		label: 'Contact Inquiries',
		icon: Mail,
		links: [{ href: '/admin/contacts', label: 'Contact Inquiries' }],
	},
	{
		label: 'CRM',
		icon: Contact,
		links: [
			{ href: '/admin/crm/contacts', label: 'Contacts' },
			{ href: '/admin/crm/campaigns', label: 'Campaigns' },
			{ href: '/admin/crm/groups', label: 'Groups' },
		],
	},
	{
		label: 'Email',
		icon: Send,
		links: [
			{ href: '/admin/email/templates', label: 'Templates' },
			{ href: '/admin/email/campaigns', label: 'Campaigns' },
			{ href: '/admin/email/groups', label: 'Groups' },
		],
	},
	{
		label: 'System',
		icon: Settings,
		links: [
			{ href: '/admin/config', label: 'Configuration' },
			{ href: '/admin/analytics', label: 'Analytics' },
			{ href: '/admin/audit-logs', label: 'Audit Logs' },
		],
	},
]

function isLinkActive(pathname: string, href: string): boolean {
	if (href === '/admin') return pathname === '/admin'
	return pathname === href || pathname.startsWith(href + '/')
}

function CollapsibleGroup({
	label,
	icon: Icon,
	links,
	subGroups,
	pathname,
	depth = 0,
}: {
	label: string
	icon: ComponentType<{ className?: string }>
	links: NavLink[]
	subGroups?: NavSubGroup[]
	pathname: string
	depth?: number
}) {
	const groupIsActive =
		links.some(link => isLinkActive(pathname, link.href)) ||
		(subGroups?.some(sg => sg.links.some(link => isLinkActive(pathname, link.href))) ??
			false)
	const [manualOpen, setManualOpen] = useState(false)
	const open = groupIsActive || manualOpen

	const iconSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
	const chevronSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
	const padding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
	const linkPadding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
	const childIndent = depth === 0 ? 'pl-8' : 'pl-4'
	const childGap = depth === 0 ? 'gap-0.5 pb-1 pt-0.5' : 'gap-0.5 pb-0.5 pt-0.5'

	return (
		<Collapsible
			open={open}
			onOpenChange={setManualOpen}
		>
			<CollapsibleTrigger
				className={`flex w-full items-center gap-2.5 rounded-md text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${padding} ${
					groupIsActive ?
						'text-[var(--gold)] bg-[rgba(244,189,51,0.08)]'
					:	'text-[var(--muted)]'
				}`}
			>
				<Icon className={`${iconSize} shrink-0`} />
				<span className="text-left leading-tight">{label}</span>
				<ChevronRight
					className={`ml-auto ${chevronSize} shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				<div className={`grid ${childGap} ${childIndent}`}>
					{links.map(link => {
						const active = isLinkActive(pathname, link.href)
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-current={active ? 'page' : undefined}
								className={`rounded-md font-semibold transition ${linkPadding} text-sm ${
									active ?
										'text-[var(--gold)] bg-[rgba(244,189,51,0.12)]'
									:	'text-[var(--muted)] hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)]'
								}`}
							>
								{link.label}
							</Link>
						)
					})}
					{subGroups?.map(sg => (
						<CollapsibleGroup
							key={sg.label}
							label={sg.label}
							icon={sg.icon}
							links={sg.links}
							depth={depth + 1}
							pathname={pathname}
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

export default function AdminNav() {
	const pathname = usePathname()
	const { openChat, openCommand } = useAdminChat()

	return (
		<nav
			className="grid gap-1"
			aria-label="Admin navigation"
		>
			<button
				type="button"
				onClick={openCommand}
				className="flex w-full items-center gap-2.5 rounded-md border border-[var(--line)] bg-[rgba(244,189,51,0.04)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
			>
				<Search className="h-4 w-4 shrink-0" />
				<span className="text-left leading-tight">Command palette</span>
				<span className="ml-auto text-[0.65rem] font-bold text-[var(--muted)]">
					Ctrl K
				</span>
			</button>

			<button
				type="button"
				onClick={openChat}
				className="flex w-full items-center gap-2.5 rounded-md border border-[var(--line)] bg-[rgba(244,189,51,0.06)] px-3 py-2 text-sm font-semibold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
			>
				<Bot className="h-4 w-4 shrink-0" />
				<span className="text-left leading-tight">AI Assistant</span>
			</button>

			<hr className="my-2 border-t border-[var(--line)]" />

			{navGroups.map(group => (
				<CollapsibleGroup
					key={group.label}
					label={group.label}
					icon={group.icon}
					links={group.links}
					subGroups={group.subGroups}
					pathname={pathname}
				/>
			))}
		</nav>
	)
}
