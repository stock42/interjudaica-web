import "server-only";

const DEVELOPMENT_AUTH_SECRET = "interjudaica-local-development-secret";

export function getAuthSecret() {
	const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

	if (secret) {
		return secret;
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set in production");
	}

	return DEVELOPMENT_AUTH_SECRET;
}
