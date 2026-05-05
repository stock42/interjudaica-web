# Changelog

## 2026-05-05
- Read MONGODB_URI/MONGODB_DATABASE env vars as fallbacks for MongoDB connection.

## 2026-05-05
- Remove hardcoded course catalog from app/lib/content and load course pages from the database/public endpoint instead.

## 2026-05-05
- Home now lists all public courses and renders them in a horizontal carousel when there are many.

## 2026-05-05
- Home no longer filters out courses missing summaries; show all published courses.

## 2026-05-05
- Remove debug logging from public course loader.

## 2026-05-05
- Add student Login button to header navigation.
- Header now shows the logged-in student profile shortcut (and hides Login/Enroll when signed in).

## 2026-05-05
- Add /contact page and API route using Resend with React email templates (user confirmation + admin notification).

## 2026-05-05
- Fix header Contact link and redesign /contact page as a two-column layout.

## 2026-05-05
- Hide contact form after successful submit and show a confirmation message.


## 2026-05-05

- Reworked the public home layout against the supplied reference, expanding the page to full-width composition, increasing contrast and scale, adding closer course/testimonial/CTA treatments, and simplifying the public footer.
- Refined the home redesign to more closely match the dark reference layout, simplifying the public header and rebuilding the featured courses, Rabbi, testimonials, and CTA sections.
- Applied the dark gold InterJudaica visual system across the public site and admin surfaces, including the new home hero, Rabbi Ernesto Yattah section, footer contact details, and updated shared UI primitives.
- Added a public `GET /api/courses` endpoint for published courses and connected the home course grid to the public course query.

## 2026-05-04

- Documented all current API endpoints in `AGENTS.md`.
- Added mandatory project workflow rules requiring changelog updates and descriptive commits after changes.


## Unreleased
- Improve contact email templates styling to match the dark/gold website theme and include the brand logo.

## Unreleased
- Add Rabbi Ernesto Yattah block to contact emails (photo + bio + response promise).

## Unreleased
- Document installed UI components and add student header popover with dashboard + logout.

## Unreleased
- Refactor forms to use components/ui primitives (Input, Label, Textarea, Button).
- Fix eslint warnings for email templates and effect lint rule in ui kit.

## Unreleased
- Refactor register form to use components/ui primitives (Input, Label, Button).

## Unreleased
- Refactor forgot/reset password screens to use components/ui primitives.

## Unreleased
- Start migrating admin list filters to components/ui Input.

## Unreleased
- Refactor admin course form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin instructor form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin operator form inputs/buttons to components/ui primitives.

## Unreleased
- Refactor admin paper form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin course category form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin paper category form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin forum form inputs/buttons to components/ui primitives.

## Unreleased
- Refactor admin collection manager form controls to components/ui primitives (Input, Textarea, Label, Button).

## Unreleased
- Use components/ui Select for admin course form (category, instructor, level, status).

## Unreleased
- Use components/ui Select for admin paper form (category, status, visibility).

## Unreleased
- Use components/ui Select for admin forum form (area, related course, status).

## Unreleased
- Use components/ui Select for admin operator form (level).

## Unreleased
- Use components/ui Select for admin course list filters.

## Unreleased
- Use components/ui Select for admin paper list filters.

## Unreleased
- Use components/ui Select for admin forum list filters.

## Unreleased
- Use components/ui Select for admin operator list filters.

## Unreleased
- Use components/ui Select for admin instructor list filters.

## Unreleased
- Use components/ui Select for admin course category list filters.

## Unreleased
- Use components/ui Select for admin paper category list filters.

## Unreleased
- Use components/ui Select for admin collection manager select fields.

## Unreleased
- Use components/ui Switch for admin enabled/featured toggles.

## Unreleased
- Use components/ui Switch for admin collection manager checkbox fields.

## Unreleased
- Use components/ui Button for admin list action buttons (Edit/Delete).

## Unreleased
- Use components/ui Button for admin list primary CTAs (New ...).

## Unreleased
- Centralize admin filter text input classes via app/admin/components/admin-controls.

## Unreleased
- Extract admin list stat pills into AdminStatPill component.

## Unreleased
- Fix SelectItem empty value usage by mapping All/None options to sentinel values.
