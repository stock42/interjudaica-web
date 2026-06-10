import { z } from 'zod'

const numberKeys = [
	'upload_image_max_size_mb',
	'upload_class_file_max_size_mb',
	'upload_attachment_max_size_mb',
	'upload_attachment_max_count',
	'rate_login_limit',
	'rate_login_window_seconds',
	'rate_register_limit',
	'rate_register_window_seconds',
	'rate_forgot_password_limit',
	'rate_forgot_password_window_seconds',
	'rate_verify_limit',
	'rate_verify_window_seconds',
	'rate_reset_password_limit',
	'rate_reset_password_window_seconds',
	'user_session_max_age_seconds',
	'operator_session_max_age_seconds',
	'verify_code_expiry_minutes',
	'reset_code_expiry_minutes',
	'password_min_length',
	'password_max_length',
	'community_membership_price_cents',
	'pagination_default_page_size',
	'contact_message_max_length',
] as const

const stringKeys = ['currency'] as const

export const schemaConfigUpdate = z
	.object({
		...Object.fromEntries(
			numberKeys.map((k) => [k, z.coerce.number().positive().optional()]),
		),
		...Object.fromEntries(stringKeys.map((k) => [k, z.string().optional()])),
	})
	.strict()
