import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { schemaConfigUpdate } from '@/models/config-schema'
import { ConfigStorage } from '@/services/config-storage'

// ── Secret key blocklist ────────────────────────────────────────────
// These keys contain sensitive credentials that MUST NOT be exposed
// through the LLM tool channel.

const SECRET_KEYS = new Set([
	'AUTH_SECRET',
	'NEXTAUTH_SECRET',
	'DEEPSEEK_API_KEY',
	'STRIPE_SECRET_KEY',
	'STRIPE_WEBHOOK_SECRET',
	'RESEND_API_KEY',
])

// ── getConfig ───────────────────────────────────────────────────────

export const getConfig = tool({
	description:
		'Get the current platform configuration. Returns all non-secret config entries with key, value, type, label, and group. Secret keys (API keys, auth secrets) are filtered out and never returned.',
	inputSchema: z.object({}),
	execute: async () => {
		const all = await ConfigStorage.getAll()
		const safe = all.filter((entry) => !SECRET_KEYS.has(entry.key))
		return {
			count: safe.length,
			entries: safe,
		}
	},
})
registerTool('getConfig', { role: 'admin' })

// ── updateConfig ────────────────────────────────────────────────────

export const updateConfig = tool({
	description:
		'Update platform configuration values. Provide key-value pairs for the config keys you want to change. Only whitelisted operational keys are accepted. Secret keys (API keys, auth secrets) are rejected. Returns the updated entries.',
	inputSchema: schemaConfigUpdate,
	execute: async (input) => {
		const results: { key: string; value: string; updated: boolean; error?: string }[] = []

		for (const [key, value] of Object.entries(input)) {
			if (value === undefined) continue

			if (SECRET_KEYS.has(key)) {
				results.push({ key, value: '[BLOCKED]', updated: false, error: 'Cannot update secret key through this interface' })
				continue
			}

			await ConfigStorage.set(key, String(value))
			results.push({ key, value: String(value), updated: true })
		}

		return {
			message: `Updated ${results.filter((r) => r.updated).length} of ${results.length} config entries`,
			results,
		}
	},
})
registerTool('updateConfig', { role: 'admin' })
