import "server-only";
import { ConfigStorage } from "@/services/config-storage";

const cache = new Map<string, number>();

async function getCachedNumber(key: string): Promise<number> {
	const cached = cache.get(key);
	if (cached !== undefined) return cached;
	const value = await ConfigStorage.getNumber(key);
	cache.set(key, value);
	return value;
}

export async function getConfig() {
	return {
		upload: {
			imageMaxSizeMb: () => getCachedNumber("upload_image_max_size_mb"),
			classFileMaxSizeMb: () => getCachedNumber("upload_class_file_max_size_mb"),
			attachmentMaxSizeMb: () => getCachedNumber("upload_attachment_max_size_mb"),
			attachmentMaxCount: () => getCachedNumber("upload_attachment_max_count"),
		},
		rateLimits: {
			login: {
				limit: () => getCachedNumber("rate_login_limit"),
				windowSeconds: () => getCachedNumber("rate_login_window_seconds"),
			},
			register: {
				limit: () => getCachedNumber("rate_register_limit"),
				windowSeconds: () => getCachedNumber("rate_register_window_seconds"),
			},
			forgotPassword: {
				limit: () => getCachedNumber("rate_forgot_password_limit"),
				windowSeconds: () => getCachedNumber("rate_forgot_password_window_seconds"),
			},
			verify: {
				limit: () => getCachedNumber("rate_verify_limit"),
				windowSeconds: () => getCachedNumber("rate_verify_window_seconds"),
			},
			resetPassword: {
				limit: () => getCachedNumber("rate_reset_password_limit"),
				windowSeconds: () => getCachedNumber("rate_reset_password_window_seconds"),
			},
		},
		sessions: {
			userMaxAgeSeconds: () => getCachedNumber("user_session_max_age_seconds"),
			operatorMaxAgeSeconds: () => getCachedNumber("operator_session_max_age_seconds"),
		},
		email: {
			verifyCodeExpiryMinutes: () => getCachedNumber("verify_code_expiry_minutes"),
			resetCodeExpiryMinutes: () => getCachedNumber("reset_code_expiry_minutes"),
		},
		security: {
			passwordMinLength: () => getCachedNumber("password_min_length"),
			passwordMaxLength: () => getCachedNumber("password_max_length"),
		},
		payments: {
			communityPriceCents: () => getCachedNumber("community_membership_price_cents"),
			currency: () => ConfigStorage.get("currency"),
		},
		general: {
			pageSize: () => getCachedNumber("pagination_default_page_size"),
			contactMessageMaxLength: () => getCachedNumber("contact_message_max_length"),
		},
	};
}

export function resetConfigCache() {
	cache.clear();
}
