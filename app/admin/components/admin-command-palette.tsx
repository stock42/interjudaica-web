'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus2, GraduationCap, Mail, Search, UserPlus } from 'lucide-react'

import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from '@/components/ui/command'

type SearchResult = {
	readonly title: string
	readonly subtitle: string
	readonly entity: string
	readonly href: string
}

const quickActions = [
	{
		title: 'New course',
		subtitle: 'Create a course shell',
		href: '/admin/courses/new',
		icon: FilePlus2,
		shortcut: 'course',
	},
	{
		title: 'Grant enrollment',
		subtitle: 'Manually enroll a student',
		href: '/admin/enrollments',
		icon: UserPlus,
		shortcut: 'access',
	},
	{
		title: 'Open contacts',
		subtitle: 'Review student inquiries',
		href: '/admin/contacts',
		icon: Mail,
		shortcut: 'contacts',
	},
	{
		title: 'Moderation queue',
		subtitle: 'Assign owners and due dates',
		href: '/admin/moderation',
		icon: GraduationCap,
		shortcut: 'queue',
	},
] as const

export function AdminCommandPalette({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const router = useRouter()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [loading, setLoading] = useState(false)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault()
				onOpenChange(!open)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [onOpenChange, open])

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current)
		}

		if (query.trim().length < 2) {
			return
		}

		debounceRef.current = setTimeout(async () => {
			setLoading(true)
			const response = await fetch(
				`/api/admin/search?q=${encodeURIComponent(query.trim())}`,
			)
			const data: unknown = await response.json().catch(() => ({}))
			setLoading(false)

			if (
				typeof data === 'object' &&
				data !== null &&
				'items' in data &&
				Array.isArray(data.items)
			) {
				setResults(
					data.items.filter(
						(item): item is SearchResult =>
							typeof item === 'object' &&
							item !== null &&
							'title' in item &&
							'subtitle' in item &&
							'entity' in item &&
							'href' in item &&
							typeof item.title === 'string' &&
							typeof item.subtitle === 'string' &&
							typeof item.entity === 'string' &&
							typeof item.href === 'string',
					),
				)
			}
		}, 250)

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}
		}
	}, [query])

	function navigate(href: string) {
		onOpenChange(false)
		setQuery('')
		router.push(href)
	}

	function handleQueryChange(value: string) {
		setQuery(value)
		if (value.trim().length < 2) {
			setResults([])
			setLoading(false)
		}
	}

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Admin command palette"
			description="Search records and run common admin actions."
			className="border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)]"
		>
			<Command className="bg-[var(--surface)] text-[var(--ink)]">
				<CommandInput
					placeholder="Search or run a command"
					value={query}
					onValueChange={handleQueryChange}
				/>
				<CommandList>
					<CommandEmpty>{loading ? 'Searching...' : 'No admin results'}</CommandEmpty>
					<CommandGroup heading="Quick actions">
						{quickActions.map(action => {
							const Icon = action.icon
							return (
								<CommandItem
									key={action.href}
									value={`${action.title} ${action.shortcut}`}
									onSelect={() => navigate(action.href)}
								>
									<Icon className="h-4 w-4 text-[var(--gold)]" />
									<span>{action.title}</span>
									<CommandShortcut>{action.subtitle}</CommandShortcut>
								</CommandItem>
							)
						})}
					</CommandGroup>
					{results.length ?
						<>
							<CommandSeparator />
							<CommandGroup heading="Search results">
								{results.map(result => (
									<CommandItem
										key={`${result.entity}-${result.href}`}
										value={`${result.title} ${result.subtitle}`}
										onSelect={() => navigate(result.href)}
									>
										<Search className="h-4 w-4 text-[var(--gold)]" />
										<span>{result.title}</span>
										<CommandShortcut>{result.subtitle}</CommandShortcut>
									</CommandItem>
								))}
							</CommandGroup>
						</>
					:	null}
				</CommandList>
			</Command>
		</CommandDialog>
	)
}
