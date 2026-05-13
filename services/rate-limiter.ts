import "server-only";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(namespace: string) {
	if (!stores.has(namespace)) {
		stores.set(namespace, new Map());
	}

	const store = stores.get(namespace)!;

	function cleanup() {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now > entry.resetAt) {
				store.delete(key);
			}
		}
	}

	return {
		check(
			key: string,
			limit: number,
			windowMs: number,
		): { allowed: boolean; retryAfter?: number } {
			cleanup();

			const now = Date.now();
			const entry = store.get(key);

			if (!entry || now > entry.resetAt) {
				store.set(key, { count: 1, resetAt: now + windowMs });
				return { allowed: true };
			}

			entry.count++;

			if (entry.count > limit) {
				const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
				return { allowed: false, retryAfter };
			}

			return { allowed: true };
		},

		reset(key: string) {
			store.delete(key);
		},
	};
}
