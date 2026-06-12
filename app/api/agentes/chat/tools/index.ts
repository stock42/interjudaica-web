// Barrel export — importing these modules triggers registerTool()
// side-effects so the TOOL_AUTH_MAP is populated before the chat
// endpoint builds its filtered tools object.
export * from './books.tool'
export * from './student.tool'
export * from './email-marketing.tool'
export * from './config.tool'
export * from './courses.tool'
export * from './create-instructor.tool'
export * from './create-subscription-plan.tool'
export * from './create-paper.tool'
export * from './create-paper-category.tool'
export * from './crm.tool'
export * from './forums.tool'
export * from './pages.tool'
export * from './papers.tool'
export * from './social-proof.tool'
export * from './users.tool'

// Side-effect imports — modules self-register via registerTool()
// createPage/createTestimonial avoid naming collisions with pages.tool/social-proof.tool
import './create-page.tool'
import './create-social-proof.tool'
import './update-owner-bio.tool'
