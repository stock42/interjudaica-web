import { describe, expect, test } from 'bun:test'
import {
	authorizeTool,
	isAdminTool,
	needsApproval,
	registerTool,
} from '@/lib/llm-tool-auth'

describe('llm-tool-auth', () => {
	// Register tools for all tests
	registerTool('listCourses', { role: 'student' })
	registerTool('deleteCourse', { role: 'admin' })
	registerTool('createForumPost', { role: 'student' })
	registerTool('listPublicContent', { role: 'public' })
	registerTool('deleteAccount', { role: 'admin', needsApproval: true })
	registerTool('sendMessage', { role: 'student', needsApproval: false })

	describe('authorizeTool', () => {
		test('student accessing student tool → allowed', () => {
			const result = authorizeTool('listCourses', { role: 'student' })
			expect(result.allowed).toBe(true)
			expect(result.reason).toBeUndefined()
		})

		test('student accessing admin tool → denied "Admin only"', () => {
			const result = authorizeTool('deleteCourse', { role: 'student' })
			expect(result.allowed).toBe(false)
			expect(result.reason).toBe('Admin only')
		})

		test('operator accessing any tool → allowed', () => {
			const studentResult = authorizeTool('listCourses', { role: 'operator' })
			expect(studentResult.allowed).toBe(true)

			const adminResult = authorizeTool('deleteCourse', { role: 'operator' })
			expect(adminResult.allowed).toBe(true)
		})

		test('unknown tool → denied', () => {
			const result = authorizeTool('nonexistentTool', { role: 'operator' })
			expect(result.allowed).toBe(false)
			expect(result.reason).toBe('Unknown tool: nonexistentTool')
		})

		test('public tool → allowed for anyone (unauthenticated)', () => {
			const result = authorizeTool('listPublicContent', { role: 'public' })
			expect(result.allowed).toBe(true)
		})

		test('public tool → allowed for student', () => {
			const result = authorizeTool('listPublicContent', { role: 'student' })
			expect(result.allowed).toBe(true)
		})

		test('public tool → allowed for operator', () => {
			const result = authorizeTool('listPublicContent', { role: 'operator' })
			expect(result.allowed).toBe(true)
		})

		test('unauthenticated user (empty role) accessing student tool → denied', () => {
			const result = authorizeTool('listCourses', { role: '' })
			expect(result.allowed).toBe(false)
			expect(result.reason).toBe('Authentication required')
		})

		test('operator accessing student tool → allowed', () => {
			const result = authorizeTool('listCourses', { role: 'operator' })
			expect(result.allowed).toBe(true)
		})
	})

	describe('isAdminTool', () => {
		test('returns true for admin tools', () => {
			expect(isAdminTool('deleteCourse')).toBe(true)
		})

		test('returns false for student tools', () => {
			expect(isAdminTool('listCourses')).toBe(false)
		})

		test('returns false for public tools', () => {
			expect(isAdminTool('listPublicContent')).toBe(false)
		})

		test('returns false for unknown tools', () => {
			expect(isAdminTool('nonexistent')).toBe(false)
		})
	})

	describe('needsApproval', () => {
		test('returns true when needsApproval is set', () => {
			expect(needsApproval('deleteAccount')).toBe(true)
		})

		test('returns false when needsApproval is explicitly false', () => {
			expect(needsApproval('sendMessage')).toBe(false)
		})

		test('returns false when needsApproval is not set', () => {
			expect(needsApproval('listCourses')).toBe(false)
		})

		test('returns false for unknown tools', () => {
			expect(needsApproval('nonexistent')).toBe(false)
		})
	})
})
