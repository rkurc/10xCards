# 10xCards Cleanup Steps: Detailed Instructions

## Step 1: Remove or Refactor Unused/Test-Only Files
- Review the following files:
  - `src/components/testing/TestLoginErrorDisplay.tsx`: Remove if not used in production.
  - `tests/unit/services/openrouter.service.mock.test.ts`: Remove if not referenced by any test runner.
  - All files in `src/services/__tests__/` and `tests/unit/services/` for duplication or test-only logic.
- For each file, check if it is imported in production code. If not, remove or move to a shared test helpers location.
- Document all removed files in the cleanup log.

## Step 2: Mark Incomplete or Stubbed Areas
- For each incomplete feature (statistics, account management, readability UI, etc.), add a TODO comment in the relevant file, e.g.:
  - `// TODO: Implement statistics dashboard (US-007)`
  - `// TODO: Implement account settings and personal data management (US-011, US-012)`
  - `// TODO: Integrate readability assessment UI (US-008)`
- Add a summary section in the documentation listing all TODOs and planned features.

## Step 3: Backend/Services Cleanup
- Refactor all service files for clarity and deduplication.
- Ensure all helpers are shared between production and test code.
- Remove or merge any legacy or duplicate service files.
- Add TODOs for any stubbed or incomplete service methods.

## Step 4: Test Cleanup
- Remove or refactor tests that reference deleted/unused code.
- Move all test helpers to a shared location if not already.
- Remove test-only files that are not helpers or mocks.

## Step 5: UI/Component Cleanup
- Remove unused components.
- Refactor components for consistency and deduplication.
- Ensure all UI code is referenced by a page or feature.
- Add TODOs for any incomplete UI features.

## Step 6: Documentation & Diagrams
- Update dependency and sequence diagrams as code is cleaned up.
- Document all incomplete or stubbed areas in a dedicated section.
- Summarize the cleanup process and next steps in the documentation.

---

## Diagrams
- Use Mermaid for sequence diagrams.
- Use simple file dependency lists for dependency diagrams.

---

*All code comments and TODOs in English. All user-facing messages in Polish.*
