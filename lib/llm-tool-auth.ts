export type ToolRole = 'admin' | 'student' | 'public'

export interface ToolAuthConfig {
	role: ToolRole
	needsApproval?: boolean
}

export interface AuthCheckResult {
	allowed: boolean
	reason?: string
}

// Global registry
const TOOL_AUTH_MAP = new Map<string, ToolAuthConfig>()

export function registerTool(name: string, config: ToolAuthConfig): void {
	TOOL_AUTH_MAP.set(name, config)
}

export function getToolConfig(name: string): ToolAuthConfig | undefined {
	return TOOL_AUTH_MAP.get(name)
}

export function authorizeTool(toolName: string, user: { role: string }): AuthCheckResult {
	const config = TOOL_AUTH_MAP.get(toolName)
	if (!config) {
		return { allowed: false, reason: `Unknown tool: ${toolName}` }
	}
	if (config.role === 'public') return { allowed: true }
	if (config.role === 'admin' && user.role !== 'operator') {
		return { allowed: false, reason: 'Admin only' }
	}
	if (config.role === 'student' && user.role !== 'student' && user.role !== 'operator') {
		return { allowed: false, reason: 'Authentication required' }
	}
	// operator can use any tool
	if (user.role === 'operator') return { allowed: true }
	// student can use student tools
	if (config.role === 'student' && user.role === 'student') return { allowed: true }

	return { allowed: false, reason: 'Insufficient permissions' }
}

export function isAdminTool(name: string): boolean {
	return TOOL_AUTH_MAP.get(name)?.role === 'admin'
}

export function needsApproval(name: string): boolean {
	return TOOL_AUTH_MAP.get(name)?.needsApproval === true
}
