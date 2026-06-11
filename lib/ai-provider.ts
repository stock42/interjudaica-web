import 'server-only'
import { createDeepSeek } from '@ai-sdk/deepseek'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL

const deepseek = createDeepSeek({
	apiKey: DEEPSEEK_API_KEY,
	baseURL: DEEPSEEK_BASE_URL,
})

// Pre-configured reasoner model for advanced tasks.
// If DEEPSEEK_API_KEY is not set, the model will fail at API call time
// (rather than at import time) so the build can complete.
export const deepseekProvider = deepseek('deepseek-reasoner')

// Export the configured provider for creating other model instances
export { deepseek }
