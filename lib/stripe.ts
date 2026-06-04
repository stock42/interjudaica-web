import "server-only";

import Stripe from "stripe";

function requireEnv(name: string) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing environment variable: ${name}`);
	}
	return value;
}

export function getStripe() {
	return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
		apiVersion: "2026-05-27.dahlia",
	});
}
