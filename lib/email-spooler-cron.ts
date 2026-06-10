import 'server-only'

import { getResend, getEmailFrom } from '@/lib/resend'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'
import { EmailTemplateStorage } from '@/services/email-templates-storage'

const FROM_EMAIL = getEmailFrom()

/**
 * Process emails in the spooler that are ready to be sent.
 * Should be called periodically (e.g., every minute via cron).
 * Sends emails where status = "new" and deliveryTime <= now.
 */
export async function processEmailSpooler(): Promise<{
	sent: number
	errors: number
}> {
	const resend = getResend()
	let sent = 0
	let errors = 0

	// Get pending emails ordered by creation time (oldest first)
	const pending = await EmailSpoolerStorage.listPending(50)

	for (const email of pending) {
		// Check delivery time
		if (email.deliveryTime) {
			const deliveryDate = new Date(email.deliveryTime)
			if (deliveryDate > new Date()) {
				continue // Not yet time to send
			}
		}

		try {
			let subject = email.subject || ''

			if (!subject && email.campaignUuid) {
				const campaign = await EmailCampaignStorage.get(email.campaignUuid)
				if (campaign) {
					const template = await EmailTemplateStorage.get(campaign.templateUuid)
					subject = template?.subject || ''
				}
			}

			await resend.emails.send({
				from: email.from || FROM_EMAIL,
				to: email.to,
				subject,
				html: email.body,
			})

			await EmailSpoolerStorage.markAsSent(email.uuid!)
			sent++
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'Unknown error'
			await EmailSpoolerStorage.markAsError(email.uuid!, errorMessage)
			errors++
		}
	}

	return { sent, errors }
}

/**
 * Retry all failed emails for a campaign
 */
export async function retryCampaignErrors(
	campaignUuid: string,
): Promise<number> {
	return EmailSpoolerStorage.retryErrors(campaignUuid)
}

/**
 * Retry a single spooler email
 */
export async function retrySingleEmail(spoolerUuid: string): Promise<boolean> {
	return EmailSpoolerStorage.retrySingle(spoolerUuid)
}
