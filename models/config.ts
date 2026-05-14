export interface ConfigEntry {
	key: string;
	value: string;
	type: "number" | "string" | "boolean";
	label: string;
	group: string;
}

export const defaultConfig: ConfigEntry[] = [
	{
		key: "upload_image_max_size_mb",
		value: "5",
		type: "number",
		label: "Max image upload size (MB)",
		group: "Uploads",
	},
	{
		key: "upload_class_file_max_size_mb",
		value: "50",
		type: "number",
		label: "Max class file upload size (MB)",
		group: "Uploads",
	},
	{
		key: "upload_attachment_max_size_mb",
		value: "5",
		type: "number",
		label: "Max email attachment size (MB)",
		group: "Uploads",
	},
	{
		key: "upload_attachment_max_count",
		value: "5",
		type: "number",
		label: "Max email attachment count",
		group: "Uploads",
	},
	{
		key: "rate_login_limit",
		value: "10",
		type: "number",
		label: "Login rate limit (attempts)",
		group: "Rate Limiting",
	},
	{
		key: "rate_login_window_seconds",
		value: "60",
		type: "number",
		label: "Login rate limit window (seconds)",
		group: "Rate Limiting",
	},
	{
		key: "rate_register_limit",
		value: "5",
		type: "number",
		label: "Register rate limit (attempts)",
		group: "Rate Limiting",
	},
	{
		key: "rate_register_window_seconds",
		value: "300",
		type: "number",
		label: "Register rate limit window (seconds)",
		group: "Rate Limiting",
	},
	{
		key: "rate_forgot_password_limit",
		value: "5",
		type: "number",
		label: "Forgot password rate limit (attempts)",
		group: "Rate Limiting",
	},
	{
		key: "rate_forgot_password_window_seconds",
		value: "300",
		type: "number",
		label: "Forgot password rate limit window (seconds)",
		group: "Rate Limiting",
	},
	{
		key: "rate_verify_limit",
		value: "10",
		type: "number",
		label: "Verify email rate limit (attempts)",
		group: "Rate Limiting",
	},
	{
		key: "rate_verify_window_seconds",
		value: "60",
		type: "number",
		label: "Verify email rate limit window (seconds)",
		group: "Rate Limiting",
	},
	{
		key: "rate_reset_password_limit",
		value: "10",
		type: "number",
		label: "Reset password rate limit (attempts)",
		group: "Rate Limiting",
	},
	{
		key: "rate_reset_password_window_seconds",
		value: "60",
		type: "number",
		label: "Reset password rate limit window (seconds)",
		group: "Rate Limiting",
	},
	{
		key: "user_session_max_age_seconds",
		value: String(60 * 60 * 24 * 7),
		type: "number",
		label: "User session max age (seconds)",
		group: "Sessions",
	},
	{
		key: "operator_session_max_age_seconds",
		value: String(60 * 60 * 8),
		type: "number",
		label: "Operator session max age (seconds)",
		group: "Sessions",
	},
	{
		key: "verify_code_expiry_minutes",
		value: "20",
		type: "number",
		label: "Email verification code expiry (minutes)",
		group: "Email",
	},
	{
		key: "reset_code_expiry_minutes",
		value: "15",
		type: "number",
		label: "Password reset code expiry (minutes)",
		group: "Email",
	},
	{
		key: "password_min_length",
		value: "8",
		type: "number",
		label: "Minimum password length",
		group: "Security",
	},
	{
		key: "password_max_length",
		value: "128",
		type: "number",
		label: "Maximum password length",
		group: "Security",
	},
	{
		key: "community_membership_price_cents",
		value: "1900",
		type: "number",
		label: "Community membership price (cents)",
		group: "Payments",
	},
	{
		key: "currency",
		value: "usd",
		type: "string",
		label: "Currency code",
		group: "Payments",
	},
	{
		key: "pagination_default_page_size",
		value: "30",
		type: "number",
		label: "Default page size for pagination",
		group: "General",
	},
	{
		key: "contact_message_max_length",
		value: "5000",
		type: "number",
		label: "Max contact message length",
		group: "General",
	},
];

export function getDefaultValue(key: string): string {
	const entry = defaultConfig.find((c) => c.key === key);
	if (!entry) {
		throw new Error(`Unknown config key: ${key}`);
	}
	return entry.value;
}

export function getDefaultNumber(key: string): number {
	return Number(getDefaultValue(key));
}

export function getConfigDefinition(key: string): ConfigEntry | undefined {
	return defaultConfig.find((c) => c.key === key);
}
