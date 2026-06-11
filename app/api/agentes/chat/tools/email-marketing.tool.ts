import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { EmailTemplateStorage } from '@/services/email-templates-storage'
import { EmailGroupStorage } from '@/services/email-groups-storage'
import { EmailCampaignStorage } from '@/services/email-campaigns-storage'
import { EmailSpoolerStorage } from '@/services/email-spooler-storage'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { generateQuery, generateTemplateHtml } from '@/lib/email-llm'
import { getEmailFrom } from '@/lib/resend'
import { emailCampaignStatuses } from '@/models/email-campaigns'

// ── listEmailTemplates ───────────────────────────────────────────────

export const listEmailTemplates = tool({
	description:
		'List all email templates in the system. Returns template summaries with uuid, name, slug, and subject.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await EmailTemplateStorage.list()
		return {
			count: items.length,
			templates: items.map((t) => ({
				uuid: t.uuid,
				name: t.name,
				slug: t.slug,
				subject: t.subject,
			})),
		}
	},
})
registerTool('listEmailTemplates', { role: 'admin' })

// ── getEmailTemplate ─────────────────────────────────────────────────

export const getEmailTemplate = tool({
	description:
		'Get full details of a single email template by its UUID. Returns name, slug, subject, and full HTML body.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the template to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const template = await EmailTemplateStorage.get(uuid)
		if (!template) {
			return { error: 'Email template not found' }
		}
		return {
			uuid: template.uuid,
			name: template.name,
			slug: template.slug,
			subject: template.subject,
			html: template.html,
		}
	},
})
registerTool('getEmailTemplate', { role: 'admin' })

// ── createEmailTemplate ──────────────────────────────────────────────

export const createEmailTemplate = tool({
	description:
		'Create a new email template. Name, subject, and HTML body are required. Available metavariables in HTML: {{firstname}}, {{lastname}}, {{email}}.',
	inputSchema: z.object({
		name: z.string().min(2).max(300).describe('Template display name'),
		subject: z
			.string()
			.min(1)
			.max(500)
			.describe('Default email subject line (may include metavariables)'),
		html: z
			.string()
			.min(1)
			.describe('HTML body content (use inline CSS, max-width 600px, include metavariables)'),
	}),
	execute: async (input) => {
		const template = await EmailTemplateStorage.create(input)
		return {
			uuid: template.uuid,
			slug: template.slug,
			name: template.name,
			subject: template.subject,
			message: 'Email template created successfully',
		}
	},
})
registerTool('createEmailTemplate', { role: 'admin' })

// ── updateEmailTemplate ──────────────────────────────────────────────

export const updateEmailTemplate = tool({
	description:
		'Update an existing email template by UUID. Only the fields provided will be updated.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the template to update'),
		name: z.string().min(2).max(300).optional().describe('Template display name'),
		subject: z
			.string()
			.min(1)
			.max(500)
			.optional()
			.describe('Default email subject line'),
		html: z
			.string()
			.min(1)
			.optional()
			.describe('HTML body content'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const template = await EmailTemplateStorage.update(uuid, updates)
		if (!template) {
			return { error: 'Email template not found' }
		}
		return {
			uuid: template.uuid,
			slug: template.slug,
			name: template.name,
			subject: template.subject,
			message: 'Email template updated successfully',
		}
	},
})
registerTool('updateEmailTemplate', { role: 'admin' })

// ── deleteEmailTemplate ──────────────────────────────────────────────

export const deleteEmailTemplate = tool({
	description:
		'Delete an email template by UUID. This action cannot be undone. ⚠️ Requires operator approval.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the template to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await EmailTemplateStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Email template not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteEmailTemplate', { role: 'admin', needsApproval: true })

// ── listEmailGroups ──────────────────────────────────────────────────

export const listEmailGroups = tool({
	description:
		'List all email groups (contact segments). Returns group summaries with uuid, name, slug, and the natural-language prompt used to define the group.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await EmailGroupStorage.list()
		return {
			count: items.length,
			groups: items.map((g) => ({
				uuid: g.uuid,
				name: g.name,
				slug: g.slug,
				promoting: g.promoting,
				query: g.query,
			})),
		}
	},
})
registerTool('listEmailGroups', { role: 'admin' })

// ── getEmailGroup ────────────────────────────────────────────────────

export const getEmailGroup = tool({
	description:
		'Get full details of a single email group by its UUID. Returns name, slug, the natural-language prompt, and the resolved MongoDB query filter.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the group to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const group = await EmailGroupStorage.get(uuid)
		if (!group) {
			return { error: 'Email group not found' }
		}
		return {
			uuid: group.uuid,
			name: group.name,
			slug: group.slug,
			promoting: group.promoting,
			query: group.query,
		}
	},
})
registerTool('getEmailGroup', { role: 'admin' })

// ── createEmailGroup ─────────────────────────────────────────────────

export const createEmailGroup = tool({
	description:
		'Create a new email group (contact segment). Provide a name and a natural-language prompting (e.g., "students who enrolled in the last 30 days") that describes which contacts should belong to this group. Use generateEmailQuery first to convert the prompting into a valid MongoDB query filter, then pass the result as the query parameter.',
	inputSchema: z.object({
		name: z.string().min(2).max(300).describe('Group display name'),
		promoting: z
			.string()
			.min(1)
			.describe(
				'Natural-language description of the target contacts (e.g., "students from New York")',
			),
		query: z
			.string()
			.default('{}')
			.describe(
				'MongoDB query filter as JSON string (use generateEmailQuery to produce this)',
			),
	}),
	execute: async (input) => {
		const group = await EmailGroupStorage.create(input)
		return {
			uuid: group.uuid,
			slug: group.slug,
			name: group.name,
			promoting: group.promoting,
			message: 'Email group created successfully',
		}
	},
})
registerTool('createEmailGroup', { role: 'admin' })

// ── updateEmailGroup ─────────────────────────────────────────────────

export const updateEmailGroup = tool({
	description:
		'Update an existing email group by UUID. Only the fields provided will be updated.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the group to update'),
		name: z.string().min(2).max(300).optional().describe('Group display name'),
		promoting: z
			.string()
			.min(1)
			.optional()
			.describe('Natural-language description of target contacts'),
		query: z
			.string()
			.optional()
			.describe('MongoDB query filter as JSON string'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const group = await EmailGroupStorage.update(uuid, updates)
		if (!group) {
			return { error: 'Email group not found' }
		}
		return {
			uuid: group.uuid,
			slug: group.slug,
			name: group.name,
			promoting: group.promoting,
			message: 'Email group updated successfully',
		}
	},
})
registerTool('updateEmailGroup', { role: 'admin' })

// ── deleteEmailGroup ─────────────────────────────────────────────────

export const deleteEmailGroup = tool({
	description:
		'Delete an email group by UUID. This action cannot be undone. ⚠️ Requires operator approval.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the group to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await EmailGroupStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Email group not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteEmailGroup', { role: 'admin', needsApproval: true })

// ── listEmailCampaigns ───────────────────────────────────────────────

export const listEmailCampaigns = tool({
	description:
		'List all email campaigns in the system. Returns campaign summaries with uuid, name, slug, status, template, and group references.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await EmailCampaignStorage.list()
		return {
			count: items.length,
			campaigns: items.map((c) => ({
				uuid: c.uuid,
				name: c.name,
				slug: c.slug,
				status: c.status,
				templateUuid: c.templateUuid,
				groupUuid: c.groupUuid,
				deliveryTime: c.deliveryTime,
			})),
		}
	},
})
registerTool('listEmailCampaigns', { role: 'admin' })

// ── createEmailCampaign ──────────────────────────────────────────────

export const createEmailCampaign = tool({
	description:
		'Create a new email campaign. Requires a template UUID and group UUID. Optionally set a delivery time (ISO string). Status defaults to draft.',
	inputSchema: z.object({
		name: z.string().min(2).max(300).describe('Campaign display name'),
		templateUuid: z
			.string()
			.uuid()
			.describe('UUID of the email template to use'),
		groupUuid: z
			.string()
			.uuid()
			.describe('UUID of the email group to target'),
		deliveryTime: z
			.string()
			.optional()
			.describe('Scheduled delivery time (ISO 8601 string)'),
		status: z
			.enum(emailCampaignStatuses)
			.default('draft')
			.describe('Campaign status (draft, running, or done)'),
	}),
	execute: async (input) => {
		const campaign = await EmailCampaignStorage.create(input)
		return {
			uuid: campaign.uuid,
			slug: campaign.slug,
			name: campaign.name,
			status: campaign.status,
			templateUuid: campaign.templateUuid,
			groupUuid: campaign.groupUuid,
			deliveryTime: campaign.deliveryTime,
			message: 'Email campaign created successfully',
		}
	},
})
registerTool('createEmailCampaign', { role: 'admin' })

// ── updateEmailCampaign ──────────────────────────────────────────────

export const updateEmailCampaign = tool({
	description:
		'Update an existing email campaign by UUID. Only the fields provided will be updated.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the campaign to update'),
		name: z.string().min(2).max(300).optional().describe('Campaign display name'),
		templateUuid: z
			.string()
			.uuid()
			.optional()
			.describe('UUID of the template to use'),
		groupUuid: z
			.string()
			.uuid()
			.optional()
			.describe('UUID of the group to target'),
		deliveryTime: z
			.string()
			.optional()
			.describe('Scheduled delivery time (ISO 8601 string)'),
		status: z
			.enum(emailCampaignStatuses)
			.optional()
			.describe('Campaign status'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const campaign = await EmailCampaignStorage.update(uuid, updates)
		if (!campaign) {
			return { error: 'Email campaign not found' }
		}
		return {
			uuid: campaign.uuid,
			slug: campaign.slug,
			name: campaign.name,
			status: campaign.status,
			templateUuid: campaign.templateUuid,
			groupUuid: campaign.groupUuid,
			deliveryTime: campaign.deliveryTime,
			message: 'Email campaign updated successfully',
		}
	},
})
registerTool('updateEmailCampaign', { role: 'admin' })

// ── deleteEmailCampaign ──────────────────────────────────────────────

export const deleteEmailCampaign = tool({
	description:
		'Delete an email campaign and all its spooler entries by UUID. This action cannot be undone. ⚠️ Requires operator approval.',
	inputSchema: z.object({
		uuid: z
			.string()
			.uuid()
			.describe('The UUID of the campaign to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await EmailCampaignStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Email campaign not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteEmailCampaign', { role: 'admin', needsApproval: true })

// ── runEmailCampaign ─────────────────────────────────────────────────

export const runEmailCampaign = tool({
	description:
		'Execute an email campaign: fetch matching contacts from the group query, render the template for each contact, and create spooler entries for delivery. ⚠️ This will actually send emails to all matched contacts. Requires operator approval.',
	inputSchema: z.object({
		campaignUuid: z
			.string()
			.uuid()
			.describe('The UUID of the campaign to run'),
	}),
	execute: async ({ campaignUuid }) => {
		const campaign = await EmailCampaignStorage.get(campaignUuid)
		if (!campaign) {
			return { error: 'Campaign not found' }
		}
		if (campaign.status === 'running') {
			return { error: 'Campaign is already running' }
		}

		const [template, group] = await Promise.all([
			EmailTemplateStorage.get(campaign.templateUuid),
			EmailGroupStorage.get(campaign.groupUuid),
		])
		if (!template) {
			return { error: 'Template not found' }
		}
		if (!group) {
			return { error: 'Group not found' }
		}

		let queryObj: Record<string, unknown> = {}
		try {
			queryObj = JSON.parse(group.query || '{}')
		} catch {
			return { error: 'Invalid group query JSON' }
		}

		const contacts = await CrmContactStorage.getMatchingContacts(queryObj)

		if (contacts.length === 0) {
			await EmailCampaignStorage.update(campaignUuid, { status: 'done' })
			return { message: 'No contacts matched', count: 0 }
		}

		const fromEmail = getEmailFrom()

		const spoolerItems = contacts.map((contact) => {
			const subject = renderTemplate(template.subject, contact)
			const html = renderTemplate(template.html, contact)
			return {
				from: fromEmail,
				to: contact.email,
				subject,
				body: html,
				campaignUuid,
				deliveryTime: campaign.deliveryTime,
				status: 'new' as const,
			}
		})

		await EmailSpoolerStorage.createBatch(spoolerItems)
		await EmailCampaignStorage.update(campaignUuid, { status: 'done' })

		return {
			message: 'Campaign initialized successfully',
			count: contacts.length,
		}
	},
})
registerTool('runEmailCampaign', { role: 'admin', needsApproval: true })

function renderTemplate(
	html: string,
	contact: { firstname: string; lastname: string; email: string },
) {
	return html
		.replace(/\{\{firstname\}\}/g, contact.firstname)
		.replace(/\{\{lastname\}\}/g, contact.lastname)
		.replace(/\{\{email\}\}/g, contact.email)
}

// ── getCampaignStats ─────────────────────────────────────────────────

export const getCampaignStats = tool({
	description:
		'Get delivery statistics for an email campaign. Returns total, sent, error, and pending counts from the email spooler.',
	inputSchema: z.object({
		campaignUuid: z
			.string()
			.uuid()
			.describe('The UUID of the campaign to get stats for'),
	}),
	execute: async ({ campaignUuid }) => {
		const campaign = await EmailCampaignStorage.get(campaignUuid)
		if (!campaign) {
			return { error: 'Campaign not found' }
		}
		const stats = await EmailCampaignStorage.getStats(campaignUuid)
		return {
			campaignUuid,
			campaignName: campaign.name,
			status: campaign.status,
			...stats,
		}
	},
})
registerTool('getCampaignStats', { role: 'admin' })

// ── generateEmailQuery ───────────────────────────────────────────────

export const generateEmailQuery = tool({
	description:
		'Use AI to generate a MongoDB query filter from a natural-language description of target contacts. Describe who you want to target (e.g., "contacts from New York who enrolled in the last month") and get back a valid MongoDB query filter as a JSON string. Use the result with createEmailGroup or updateEmailGroup.',
	inputSchema: z.object({
		prompting: z
			.string()
			.min(1)
			.describe(
				'Natural-language description of the target contacts (e.g., "contacts from New York")',
			),
	}),
	execute: async ({ prompting }) => {
		try {
			const queryJson = await generateQuery(prompting)
			return { query: queryJson }
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown AI error'
			return { error: `Failed to generate query: ${message}` }
		}
	},
})
registerTool('generateEmailQuery', { role: 'admin' })

// ── generateEmailTemplate ────────────────────────────────────────────

export const generateEmailTemplate = tool({
	description:
		'Use AI to generate responsive HTML email content for InterJudaica. Describe what the email should say (e.g., "a welcome email for new students") and provide the subject line. Returns ready-to-use HTML with inline CSS that you can use with createEmailTemplate.',
	inputSchema: z.object({
		prompting: z
			.string()
			.min(1)
			.describe(
				'Description of the email content to generate (e.g., "a welcome email for new students introducing our courses")',
			),
		subject: z
			.string()
			.min(1)
			.describe('The email subject line'),
	}),
	execute: async ({ prompting, subject }) => {
		try {
			const html = await generateTemplateHtml(prompting, subject)
			return { html }
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unknown AI error'
			return { error: `Failed to generate template: ${message}` }
		}
	},
})
registerTool('generateEmailTemplate', { role: 'admin' })
