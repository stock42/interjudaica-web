import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	generateCsrfToken,
	csrfCookieOptions,
	CSRF_COOKIE,
} from '@/services/csrf'

export function proxy(request: NextRequest) {
	const response = NextResponse.next()

	// Only set CSRF cookie for page requests, not API/static
	const { pathname } = request.nextUrl
	if (
		!pathname.startsWith('/api/') &&
		!pathname.startsWith('/_next/') &&
		!pathname.startsWith('/public/') &&
		!pathname.includes('.')
	) {
		const token = generateCsrfToken()
		const options = csrfCookieOptions()
		response.cookies.set(CSRF_COOKIE, token, {
			httpOnly: false,
			secure: options.secure,
			sameSite: options.sameSite,
			path: options.path,
			maxAge: options.maxAge,
		})
		// Also set as a response header that the client can read
		response.headers.set('X-CSRF-Token', token)
	}

	return response
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
