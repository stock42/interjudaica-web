import 'server-only'

import { tool } from 'ai'
import { z } from 'zod'

import { registerTool } from '@/lib/llm-tool-auth'
import { InstructorStorage } from '@/services/instructors-storage'

// ── createInstructor ─────────────────────────────────────────────────

export const createInstructor = tool({
	description:
		'Create a new instructor. Required: firstName, lastName. Optional: displayName (auto-generated from firstName + lastName if omitted), email, bio, photoUrl, enabled (defaults to true).',
	inputSchema: z.object({
		firstName: z.string().trim().min(1).describe('Instructor first name'),
		lastName: z.string().trim().min(1).describe('Instructor last name'),
		displayName: z.string().trim().optional().describe('Display name (auto-generated if omitted)'),
		email: z.preprocess(
			(value) => (value === '' ? undefined : value),
			z.string().email().optional(),
		).describe('Instructor email'),
		bio: z.string().trim().default('').describe('Instructor biography'),
		photoUrl: z.string().trim().default('').describe('Instructor photo URL'),
		enabled: z.boolean().default(true).describe('Whether this instructor is enabled'),
	}),
	execute: async (input) => {
		const instructor = await InstructorStorage.create(input)
		return {
			uuid: instructor.uuid,
			slug: instructor.slug,
			firstName: instructor.firstName,
			lastName: instructor.lastName,
			displayName: instructor.displayName,
			email: instructor.email,
			bio: instructor.bio,
			photoUrl: instructor.photoUrl,
			enabled: instructor.enabled,
			message: 'Instructor created successfully',
		}
	},
})
registerTool('createInstructor', { role: 'admin' })
