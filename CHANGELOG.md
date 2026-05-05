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
