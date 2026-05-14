import type { NextConfig } from "next";

const cspHeader = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://*.interjudaica.com https://js.stripe.com",
	"font-src 'self'",
	"connect-src 'self' https://api.stripe.com https://api.resend.com",
	"frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self' https://checkout.stripe.com",
	"frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.interjudaica.com',
				port: '',
				search: '',
			},
		],
	},
	allowedDevOrigins: ['interjudaica.com'],
	async headers() {
		return [
			{
				source: "/((?!_next/static|_next/image|favicon.ico).*)",
				headers: [
					{ key: "Content-Security-Policy", value: cspHeader },
					{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
				],
			},
		];
	},
};

export default nextConfig;
