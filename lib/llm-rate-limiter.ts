import 'server-only'
import { createRateLimiter } from '@/services/rate-limiter'

const adminLimiter = createRateLimiter('agent-chat-admin')
const studentLimiter = createRateLimiter('agent-chat-student')

export async function checkChatRateLimit(
	role: 'operator' | 'student',
	key: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
	const limiter = role === 'operator' ? adminLimiter : studentLimiter
	const limit = role === 'operator' ? 60 : 20
	const windowSeconds = 3600 // 1 hour
	return limiter.check(key, limit, windowSeconds * 1000)
}
