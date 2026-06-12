import type { Metadata } from 'next'
import Image from 'next/image'
import type { TypeRecommendedBook } from '@/models/recommended-books'
import { RecommendedBookStorage } from '@/services/recommended-books-storage'
import {
	PageShell,
	Section,
	SectionIntro,
	ButtonLink,
} from '@/app/components/portal-ui'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Resources — Books',
	description:
		'Recommended Jewish books and resources hand-picked by Ernesto Yattah. Browse our curated collection of essential reading for Jewish learning.',
}

export default async function ResourcesBooksPage() {
	const books = await RecommendedBookStorage.listPublished()

	return (
		<PageShell>
			<Section tone="transparent">
				<SectionIntro
					eyebrow="Resources"
					title="Recommended Books"
					text="A curated collection of essential Jewish books and resources, hand-picked by Ernesto Yattah to deepen your learning."
				/>

				{books.length === 0 ? (
					<div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--muted)]">
						Recommended books will appear here soon. Check back for new additions.
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
						{books.map((book) => (
							<BookCard key={book.uuid} book={book} />
						))}
					</div>
				)}
			</Section>
		</PageShell>
	)
}

function BookCard({ book }: { book: TypeRecommendedBook }) {
	const hasAmazon = !!book.amazonLink

	return (
		<article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[linear-gradient(145deg,rgba(23,28,32,0.98),rgba(8,10,12,0.98))] shadow-[var(--shadow)] transition hover:-translate-y-1 hover:border-[rgba(244,189,51,0.62)]">
			{/* Cover image */}
			<div className="relative aspect-[3/4] overflow-hidden bg-[#050608]">
				{book.coverImageUrl ? (
					<Image
						src={book.coverImageUrl}
						alt={book.name}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
						className="object-cover transition group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full items-center justify-center">
						<span className="text-sm font-semibold text-[var(--muted)]">
							No cover
						</span>
					</div>
				)}
			</div>

			{/* Card body */}
			<div className="flex flex-1 flex-col p-5 sm:p-6">
				<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
					{book.author}
				</p>

				<h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--ink)]">
					{book.name}
				</h3>

				{book.description ? (
					<p className="mt-3 flex-1 text-sm leading-6 text-[var(--muted)]">
						{book.description}
					</p>
				) : (
					<div className="mt-3 flex-1" />
				)}

				{hasAmazon ? (
					<div className="mt-6">
						<ButtonLink
							href={book.amazonLink}
							tone="primary"
							className="w-full"
						>
							Buy on Amazon
						</ButtonLink>
					</div>
				) : null}
			</div>
		</article>
	)
}
