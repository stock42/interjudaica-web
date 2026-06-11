'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
	Megaphone,
	Settings,
	ChevronRight,
	Mail,
	Bot,
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
		links: [{ href: '/admin', label: 'Panel Principal' }],
	},
	{
		label: 'Cursos',
		icon: BookOpen,
		links: [
			{ href: '/admin/courses', label: 'Cursos' },
			{ href: '/admin/course-categories', label: 'Categorías de cursos' },
			{ href: '/admin/instructors', label: 'Instructores' },
		],
	},
	{
		label: 'Contenido',
		icon: FileText,
		links: [
			{ href: '/admin/papers', label: 'Artículos' },
			{ href: '/admin/paper-categories', label: 'Categorías de artículos' },
			{ href: '/admin/pages', label: 'Páginas' },
			{ href: '/admin/translations', label: 'Traducciones' },
			{ href: '/admin/social-proof', label: 'Testimonios' },
			{ href: '/admin/rabbi-bio', label: 'Biografía del Rabino' },
		],
	},
	{
		label: 'Usuarios',
		icon: Users,
		links: [
			{ href: '/admin/users', label: 'Usuarios' },
			{ href: '/admin/operators', label: 'Operadores' },
			{ href: '/admin/community-users', label: 'Acceso comunidad' },
			{ href: '/admin/password-resets', label: 'Reseteos de contraseña' },
		],
	},
	{
		label: 'Ventas',
		icon: DollarSign,
		links: [
			{ href: '/admin/subscription-plans', label: 'Planes de suscripción' },
			{ href: '/admin/subscriptions', label: 'Suscripciones' },
			{ href: '/admin/payments', label: 'Pagos' },
			{ href: '/admin/books', label: 'Libros' },
			{ href: '/admin/book-sales', label: 'Ventas de libros' },
			{ href: '/admin/coupons', label: 'Cupones' },
			{ href: '/admin/enrollments', label: 'Inscripciones' },
		],
	},
	{
		label: 'Marketing',
		icon: Megaphone,
		links: [
			{ href: '/admin/forum', label: 'Foro' },
			{ href: '/admin/contacts', label: 'Consultas de contacto' },
			{ href: '/admin/crm/contacts', label: 'Contactos CRM' },
			{ href: '/admin/crm/campaigns', label: 'Campañas CRM' },
		],
		subGroups: [
			{
				label: 'Email',
				icon: Mail,
				links: [
					{ href: '/admin/email/templates', label: 'Plantillas' },
					{ href: '/admin/email/campaigns', label: 'Campañas' },
					{ href: '/admin/email/groups', label: 'Grupos' },
				],
			},
		],
	},
	{
		label: 'Sistema',
		icon: Settings,
		links: [
			{ href: '/admin/config', label: 'Configuración' },
			{ href: '/admin/analytics', label: 'Analytics' },
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
		links.some((link) => isLinkActive(pathname, link.href)) ||
		(subGroups?.some((sg) =>
			sg.links.some((link) => isLinkActive(pathname, link.href))
		) ?? false)
	const [open, setOpen] = useState(true)

	// Close group when navigating away if not active
	useEffect(() => {
		if (!groupIsActive) setOpen(false)
	}, [groupIsActive])

	const iconSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
	const chevronSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
	const padding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
	const linkPadding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
	const childIndent = depth === 0 ? 'pl-8' : 'pl-4'
	const childGap = depth === 0 ? 'gap-0.5 pb-1 pt-0.5' : 'gap-0.5 pb-0.5 pt-0.5'

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger
				className={`flex w-full items-center gap-2.5 rounded-md text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] ${padding} ${
					groupIsActive
						? 'text-[var(--gold)] bg-[rgba(244,189,51,0.08)]'
						: 'text-[var(--muted)]'
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
					{links.map((link) => {
						const active = isLinkActive(pathname, link.href)
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-current={active ? 'page' : undefined}
								className={`rounded-md font-semibold transition ${linkPadding} text-sm ${
									active
										? 'text-[var(--gold)] bg-[rgba(244,189,51,0.12)]'
										: 'text-[var(--muted)] hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)]'
								}`}
							>
								{link.label}
							</Link>
						)
					})}
					{subGroups?.map((sg) => (
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
	const { openChat } = useAdminChat()

	return (
		<nav className="grid gap-1" aria-label="Admin navigation">
			<button
				type="button"
				onClick={openChat}
				className="flex w-full items-center gap-2.5 rounded-md text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] px-3 py-2 text-[var(--muted)]"
			>
				<Bot className="h-4 w-4 shrink-0" />
				<span className="text-left leading-tight">AI Assistant</span>
			</button>

			<hr className="mx-3 border-t border-[var(--line)]" />

			{navGroups.map((group) => (
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
