import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { filterToolResult } from '@/lib/llm-pii-guard'
import { CrmContactStorage } from '@/services/crm-contacts-storage'
import { CrmTagStorage } from '@/services/crm-tags-storage'
import { CrmCampaignStorage } from '@/services/crm-campaigns-storage'
import { CrmCampaignContactStorage } from '@/services/crm-campaign-contacts-storage'

// ── CSV helpers ─────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
	const result: string[] = []
	let current = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i++) {
		const char = line[i]
		if (inQuotes) {
			if (char === '"') {
				if (line[i + 1] === '"') {
					current += '"'
					i++
				} else {
					inQuotes = false
				}
			} else {
				current += char
			}
		} else {
			if (char === '"') {
				inQuotes = true
			} else if (char === ',') {
				result.push(current.trim())
				current = ''
			} else {
				current += char
			}
		}
	}
	result.push(current.trim())
	return result
}

function csvEscape(field: string): string {
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replace(/"/g, '""')}"`
	}
	return field
}

function contactsToCsv(
	rows: { firstname: string; lastname: string; email: string; tags: string }[],
): string {
	const header = 'firstname,lastname,email,tags'
	const lines = rows.map((r) =>
		[csvEscape(r.firstname), csvEscape(r.lastname), csvEscape(r.email), csvEscape(r.tags)].join(
			',',
		),
	)
	return [header, ...lines].join('\n')
}

// ── CRM Contacts ────────────────────────────────────────────────────

export const listCrmContacts = tool({
	description:
		'List or search CRM contacts with pagination. Supports full-text search by name/email and filtering by tag UUIDs. Returns safe contact data — notes are included but PII is filtered at context level.',
	inputSchema: z.object({
		page: z.coerce.number().int().min(1).optional().describe('Page number (default 1)'),
		limit: z.coerce.number().int().min(1).max(100).optional().describe('Results per page (default 30)'),
		query: z.string().trim().optional().describe('Full-text search by name or email'),
		tagUuids: z.array(z.string().uuid()).optional().describe('Filter contacts by tag UUIDs'),
		sort: z.string().trim().optional().describe('Sort field'),
	}),
	execute: async (options) => {
		const result = await CrmContactStorage.search(options)
		return filterToolResult('listCrmContacts', {
			count: result.count,
			items: result.items,
			page: result.page,
			totalPages: result.totalPages,
		})
	},
})
registerTool('listCrmContacts', { role: 'admin' })

export const getCrmContact = tool({
	description:
		'Get a single CRM contact by UUID. Returns full contact data including notes, tags, and notes timestamp.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the CRM contact to retrieve'),
	}),
	execute: async ({ uuid }) => {
		const contact = await CrmContactStorage.get(uuid)
		if (!contact) {
			return { error: 'Contact not found' }
		}
		return filterToolResult('getCrmContact', contact)
	},
})
registerTool('getCrmContact', { role: 'admin' })

export const createCrmContact = tool({
	description:
		'Create a new CRM contact. Email is automatically normalized to lowercase. First name, last name, and email are required.',
	inputSchema: z.object({
		firstname: z.string().trim().min(1).max(200).describe('Contact first name'),
		lastname: z.string().trim().min(1).max(200).describe('Contact last name'),
		email: z.string().email().max(320).describe('Contact email address'),
		notes: z.string().trim().max(10000).default('').describe('Optional notes about the contact'),
		tags: z.array(z.string().uuid()).default([]).describe('Optional array of tag UUIDs'),
	}),
	execute: async (input) => {
		const contact = await CrmContactStorage.create(input)
		return filterToolResult('createCrmContact', {
			...contact,
			message: 'Contact created successfully',
		})
	},
})
registerTool('createCrmContact', { role: 'admin' })

export const updateCrmContact = tool({
	description:
		'Update an existing CRM contact by UUID. Only the fields provided will be updated. Updating notes automatically sets the notes timestamp.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the contact to update'),
		firstname: z.string().trim().min(1).max(200).optional().describe('Updated first name'),
		lastname: z.string().trim().min(1).max(200).optional().describe('Updated last name'),
		email: z.string().email().max(320).optional().describe('Updated email address'),
		notes: z.string().trim().max(10000).optional().describe('Updated notes'),
		tags: z.array(z.string().uuid()).optional().describe('Updated tag UUIDs (replaces all)'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const updated = await CrmContactStorage.update(uuid, updates)
		if (!updated) {
			return { error: 'Contact not found' }
		}
		return filterToolResult('updateCrmContact', {
			...updated,
			message: 'Contact updated successfully',
		})
	},
})
registerTool('updateCrmContact', { role: 'admin' })

export const deleteCrmContact = tool({
	description:
		'Delete a CRM contact permanently by UUID. This action cannot be undone. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the contact to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await CrmContactStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Contact not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteCrmContact', { role: 'admin', needsApproval: true })

export const importCrmContacts = tool({
	description:
		'Import CRM contacts from a CSV string. The CSV must have a header row with columns: firstname,lastname,email. Duplicate emails are skipped. Returns import statistics.',
	inputSchema: z.object({
		csv: z.string().trim().min(1).describe('CSV content as a string with header row'),
	}),
	execute: async ({ csv }) => {
		const lines = csv.split('\n').filter((l) => l.trim())
		if (lines.length < 2) {
			return { error: 'CSV must contain a header row and at least one data row' }
		}

		const headers = parseCsvLine(lines[0])
		const requiredHeaders = ['firstname', 'lastname', 'email']
		const missingHeaders = requiredHeaders.filter(
			(h) => !headers.includes(h),
		)
		if (missingHeaders.length > 0) {
			return {
				error: `CSV missing required headers: ${missingHeaders.join(', ')}`,
			}
		}

		const firstIndex = headers.indexOf('firstname')
		const lastIndex = headers.indexOf('lastname')
		const emailIndex = headers.indexOf('email')

		const contacts = []
		for (let i = 1; i < lines.length; i++) {
			const fields = parseCsvLine(lines[i])
			if (fields.length < headers.length) continue

			contacts.push({
				firstname: fields[firstIndex] ?? '',
				lastname: fields[lastIndex] ?? '',
				email: fields[emailIndex] ?? '',
			})
		}

		if (contacts.length === 0) {
			return { error: 'No valid data rows found in CSV' }
		}

		const result = await CrmContactStorage.bulkImport(contacts)
		return {
			message: `Import complete: ${result.imported} imported, ${result.skipped} skipped`,
			imported: result.imported,
			skipped: result.skipped,
		}
	},
})
registerTool('importCrmContacts', { role: 'admin' })

export const exportCrmContacts = tool({
	description:
		'Export CRM contacts as CSV. Returns the export record count and a preview of the first 500 characters of the CSV. Full CSV is not returned — use the admin UI for complete exports.',
	inputSchema: z.object({
		query: z.string().trim().optional().describe('Optional full-text search to filter contacts for export'),
		tagUuids: z.array(z.string().uuid()).optional().describe('Optional tag UUIDs to filter contacts for export'),
	}),
	execute: async (options) => {
		const rows = await CrmContactStorage.getExportData(options)
		const csv = contactsToCsv(rows)
		return {
			count: rows.length,
			preview: csv.slice(0, 500),
		}
	},
})
registerTool('exportCrmContacts', { role: 'admin' })

// ── CRM Tags ────────────────────────────────────────────────────────

export const listCrmTags = tool({
	description: 'List all CRM tags alphabetically by name. Tags are used to categorize and filter contacts.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await CrmTagStorage.list()
		return filterToolResult('listCrmTags', { count: items.length, tags: items })
	},
})
registerTool('listCrmTags', { role: 'admin' })

export const createCrmTag = tool({
	description:
		'Create a new CRM tag. Tag names are case-insensitive and will be normalized to lowercase. Tags are used to categorize contacts.',
	inputSchema: z.object({
		name: z.string().trim().min(1).max(100).describe('Tag name (will be lowercased)'),
	}),
	execute: async (input) => {
		const tag = await CrmTagStorage.create(input)
		return filterToolResult('createCrmTag', {
			...tag,
			message: 'Tag created successfully',
		})
	},
})
registerTool('createCrmTag', { role: 'admin' })

// ── CRM Campaigns ───────────────────────────────────────────────────

export const listCrmCampaigns = tool({
	description:
		'List all CRM campaigns alphabetically by name. Campaigns are used to organize outreach sequences for contacts.',
	inputSchema: z.object({}),
	execute: async () => {
		const items = await CrmCampaignStorage.list()
		return filterToolResult('listCrmCampaigns', {
			count: items.length,
			campaigns: items,
		})
	},
})
registerTool('listCrmCampaigns', { role: 'admin' })

export const createCrmCampaign = tool({
	description:
		'Create a new CRM campaign. A slug is auto-generated from the name. Campaigns are used to track outreach sequences and assign contacts.',
	inputSchema: z.object({
		name: z.string().trim().min(2).max(300).describe('Campaign name'),
		description: z.string().trim().max(5000).default('').describe('Campaign description or goal'),
	}),
	execute: async (input) => {
		const campaign = await CrmCampaignStorage.create(input)
		return filterToolResult('createCrmCampaign', {
			...campaign,
			message: 'Campaign created successfully',
		})
	},
})
registerTool('createCrmCampaign', { role: 'admin' })

export const updateCrmCampaign = tool({
	description:
		'Update an existing CRM campaign by UUID. Only the fields provided will be updated. The slug is regenerated if the name changes.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the campaign to update'),
		name: z.string().trim().min(2).max(300).optional().describe('Updated campaign name'),
		description: z.string().trim().max(5000).optional().describe('Updated campaign description'),
	}),
	execute: async ({ uuid, ...updates }) => {
		const updated = await CrmCampaignStorage.update(uuid, updates)
		if (!updated) {
			return { error: 'Campaign not found' }
		}
		return filterToolResult('updateCrmCampaign', {
			...updated,
			message: 'Campaign updated successfully',
		})
	},
})
registerTool('updateCrmCampaign', { role: 'admin' })

export const deleteCrmCampaign = tool({
	description:
		'Delete a CRM campaign permanently by UUID. This also removes all contact assignments for this campaign. ⚠️ Requires operator approval before execution.',
	inputSchema: z.object({
		uuid: z.string().uuid().describe('The UUID of the campaign to delete'),
	}),
	execute: async ({ uuid }) => {
		const deletedCount = await CrmCampaignStorage.delete(uuid)
		if (deletedCount === 0) {
			return { error: 'Campaign not found' }
		}
		return { deleted: true, uuid }
	},
})
registerTool('deleteCrmCampaign', { role: 'admin', needsApproval: true })

export const assignContactToCampaign = tool({
	description:
		'Assign a CRM contact to a campaign. Optionally set an initial status. If the contact is already assigned to the campaign, the operation is silently skipped.',
	inputSchema: z.object({
		campaignUuid: z.string().uuid().describe('UUID of the campaign'),
		contactUuid: z.string().uuid().describe('UUID of the contact to assign'),
		status: z.string().trim().max(200).default('').describe('Optional initial status (e.g., "pending", "contacted", "converted")'),
	}),
	execute: async ({ campaignUuid, contactUuid, status }) => {
		try {
			const link = await CrmCampaignContactStorage.assign(campaignUuid, contactUuid, status)
			return filterToolResult('assignContactToCampaign', {
				...link,
				message: 'Contact assigned to campaign successfully',
			})
		} catch (error: unknown) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				(error as Record<string, unknown>).code === 11000
			) {
				return {
					message: 'Contact is already assigned to this campaign',
					campaignUuid,
					contactUuid,
				}
			}
			throw error
		}
	},
})
registerTool('assignContactToCampaign', { role: 'admin' })

export const updateCampaignContactStatus = tool({
	description:
		'Update the status of a contact within a campaign. Common statuses include "pending", "contacted", "responded", "converted", "unsubscribed".',
	inputSchema: z.object({
		campaignUuid: z.string().uuid().describe('UUID of the campaign'),
		contactUuid: z.string().uuid().describe('UUID of the contact'),
		status: z.string().trim().max(200).describe('New status for the contact in this campaign'),
	}),
	execute: async ({ campaignUuid, contactUuid, status }) => {
		const updated = await CrmCampaignContactStorage.updateStatus(
			campaignUuid,
			contactUuid,
			status,
		)
		if (!updated) {
			return {
				error: 'Campaign contact assignment not found. Assign the contact to the campaign first.',
			}
		}
		return filterToolResult('updateCampaignContactStatus', {
			...updated,
			message: 'Contact status updated successfully',
		})
	},
})
registerTool('updateCampaignContactStatus', { role: 'admin' })
