# Changelog

## 2026-05-05

- Reworked the public home layout against the supplied reference, expanding the page to full-width composition, increasing contrast and scale, adding closer course/testimonial/CTA treatments, and simplifying the public footer.
- Refined the home redesign to more closely match the dark reference layout, simplifying the public header and rebuilding the featured courses, Rabbi, testimonials, and CTA sections.
- Applied the dark gold InterJudaica visual system across the public site and admin surfaces, including the new home hero, Rabbi Ernesto Yattah section, footer contact details, and updated shared UI primitives.
- Added a public `GET /api/courses` endpoint for published courses and connected the home course grid to the public course query.

## 2026-05-04

- Documented all current API endpoints in `AGENTS.md`.
- Added mandatory project workflow rules requiring changelog updates and descriptive commits after changes.

## Unreleased
- Read MONGODB_URI/MONGODB_DATABASE env vars as fallbacks for MongoDB connection.

## Unreleased
- Remove hardcoded course catalog from app/lib/content and load course pages from the database/public endpoint instead.

## Unreleased
- Home now lists all public courses and renders them in a horizontal carousel when there are many.

## Unreleased
- Home no longer filters out courses missing summaries; show all published courses.

## Unreleased
- Remove debug logging from public course loader.

## Unreleased
- Add student Login button to header navigation.

## Unreleased
- Header now shows the logged-in student profile shortcut (and hides Login/Enroll when signed in).
