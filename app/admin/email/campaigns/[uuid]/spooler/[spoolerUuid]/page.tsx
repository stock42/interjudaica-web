import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import sanitizeHtml from 'sanitize-html'
import { AdminShell } from '@/app/components/portal-ui'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'

export const metadata: Metadata = { title: 'Email Preview' }

function sanitizeEmailHtml(dirty: string): string {
	return sanitizeHtml(dirty, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
			'style', 'br', 'hr', 'span', 'div', 'section', 'header', 'footer',
		]),
		allowedAttributes: {
			'*': ['style', 'class', 'id', 'align', 'valign'],
			a: ['href', 'target', 'rel', 'title'],
			img: ['src', 'alt', 'width', 'height', 'style'],
			td: ['colspan', 'rowspan'],
			th: ['colspan', 'rowspan'],
		},
		allowedSchemes: ['http', 'https', 'mailto'],
		transformTags: {
			a: (tagName, attribs) => ({
				tagName,
				attribs: {
					...attribs,
					target: '_blank',
					rel: 'noopener noreferrer',
				},
			}),
		},
	})
}

export const runtime = 'nodejs'

export default async function SpoolerPreviewPage({
	params,
}: {
	params: Promise<{ uuid: string; spoolerUuid: string }>
}) {
	const { spoolerUuid } = await params
	const email = await EmailSpoolerStorage.get(spoolerUuid)
	if (!email) notFound()

	const sanitizedBody = sanitizeEmailHtml(email.body)

	return (
		<AdminShell title="Email Preview" description={`To: ${email.to} — Status: ${email.status}`}>
			<section className="rounded-lg border border-[var(--line)] bg-white p-4 sm:p-5">
				<div className="mb-4 grid gap-2 text-sm">
					<p><strong>From:</strong> {email.from}</p>
					<p><strong>To:</strong> {email.to}</p>
					<p><strong>Status:</strong> {email.status}</p>
					{email.error && <p className="text-red-600"><strong>Error:</strong> {email.error}</p>}
					{email.deliveryTime && <p><strong>Scheduled:</strong> {new Date(email.deliveryTime).toLocaleString()}</p>}
				</div>
				<div
					className="rounded-md border border-[var(--line)] p-4"
					dangerouslySetInnerHTML={{ __html: sanitizedBody }}
				/>
			</section>
		</AdminShell>
	)
}
