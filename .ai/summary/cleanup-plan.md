# 10xCards Cleanup Plan (Iteration 1)

## 1. Remove or Refactor Unused/Test-Only Files
- Remove files that are not imported anywhere in production code or are only referenced by tests, unless they are shared helpers.
- List of candidates for removal:
  - `src/components/testing/TestLoginErrorDisplay.tsx` (test-only, not used in production)
  - `tests/unit/services/openrouter.service.mock.test.ts` (if not referenced by any test runner)
- Review all files in `src/services/__tests__/` and `tests/unit/services/` for duplication or test-only logic.

## 2. Mark Incomplete or Stubbed Areas
- Add TODO comments (in English) in code for all incomplete or stubbed features, e.g.:
  - Statistics dashboard (US-007)
  - Account settings and personal data management (US-011, US-012)
  - Readability assessment UI (US-008)
- Add a section in documentation summarizing all TODOs and planned features.

## 3. Backend/Services Cleanup
- Refactor service code for clarity, deduplication, and error handling.
- Ensure all helpers are shared between production and test code (no test-only duplicates).
- Remove or merge any legacy or duplicate service files.

## 4. Test Cleanup
- Remove or refactor tests that reference deleted/unused code.
- Ensure all test helpers are in shared locations.
- Remove test-only files that are not helpers or mocks.

## 5. UI/Component Cleanup
- Remove unused components.
- Refactor components for consistency and deduplication.
- Ensure all UI code is referenced by a page or feature.

## 6. Documentation & Diagrams
- Update or create diagrams for each use case.
- Document any incomplete or stubbed areas (admin, analytics, etc.).
- Summarize the cleanup process and next steps.

---

## Next Steps
- Review the list of files to be removed/refactored.
- Confirm TODOs and planned features.
- Begin with backend/services cleanup, then tests, then UI/components.

---

*All user-facing messages should remain in Polish. All code comments and TODOs should be in English.*
