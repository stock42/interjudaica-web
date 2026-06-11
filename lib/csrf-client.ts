'use client'

const CSRF_COOKIE = '__Host-interjudaica_csrf'
const CSRF_HEADER = 'x-csrf-token'

export function getCsrfToken(): string | null {
	// Try to read from cookie
	const cookies = document.cookie.split('; ')
	for (const cookie of cookies) {
		const [name, value] = cookie.split('=')
		if (name === CSRF_COOKIE) return decodeURIComponent(value)
	}
	return null
}

export function csrfFetch(
	url: string,
	options: RequestInit = {},
): Promise<Response> {
	const token = getCsrfToken()
	return fetch(url, {
		...options,
		headers: {
			...options.headers,
			[CSRF_HEADER]: token ?? '',
		},
	})
}
