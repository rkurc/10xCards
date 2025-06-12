# 10xCards File Dependency Diagrams

*For each use case, list main files and their dependencies (services, components, utils, pages, etc).*

## US-001: Automatic Flashcard Generation
- `src/pages/api/generation/process-text.ts` <-> `src/services/generation.service.ts` <-> `src/lib/services/openrouter.service.ts`
- `src/lib/services/openrouter.service.ts` <-> `../../types/openrouter.types.ts`
- `src/pages/generate.astro` <-> `src/components/generate/GenerateForm.tsx`

## US-002: Manual Flashcard Management
- `src/pages/api/cards/index.ts` <-> `src/services/card.service.ts`
- `src/pages/api/cards/[id]/index.ts` <-> `src/services/card.service.ts`
- `src/components/card-sets/EditCardModal.tsx` <-> `src/services/card.service.ts`
- `src/components/card-sets/CardSetDetail.tsx` <-> `src/components/card-sets/EditCardModal.tsx`

## US-003: User Registration & Login
- `src/services/auth.service.ts` <-> `src/db/supabase.service.ts`
- `src/components/auth/LoginForm.tsx` <-> `src/services/auth.service.ts`
- `src/components/auth/RegisterForm.tsx` <-> `src/services/auth.service.ts`
- `src/pages/login.astro`, `src/pages/register.astro`

## US-009: Card Set Management
- `src/pages/api/card-sets/index.ts` <-> `src/services/card-set.service.ts`
- `src/pages/api/card-sets/[id]/index.ts` <-> `src/services/card-set.service.ts`
- `src/pages/api/card-sets/[id]/cards/index.ts` <-> `src/services/card-set.service.ts`
- `src/components/card-sets/CardSetDetail.tsx` <-> `src/services/card-set.service.ts`

## US-006: Accept/Reject Generated Cards
- `src/pages/api/generation/[generation_id]/cards/[card_id]/accept.ts` <-> `src/services/generation.service.ts`
- `src/pages/api/generation/[generation_id]/cards/[card_id]/reject.ts` <-> `src/services/generation.service.ts`
- `src/components/generate/ReviewGeneratedCards.tsx`

## US-007: Generation Statistics
- `src/pages/api/generation/[generation_id]/results.ts` <-> `src/services/generation.service.ts`
- `src/components/statistics/GenerationStats.tsx`

## US-008: Readability Assessment
- `src/lib/services/openrouter.service.ts` (readability scoring logic)
- `src/components/card-sets/EditCardModal.tsx` (planned integration)

## US-010: Error Handling for Generation
- All API endpoints: error handling in each `/api/` file
- `src/lib/services/openrouter.service.ts` (error handling logic)
- `src/components/ui/Toast.tsx` (user notifications)

## US-011: Personal Data Management
- `src/pages/api/user/export.ts` (planned)
- `src/pages/api/user/delete.ts` (planned)
- `src/services/auth.service.ts`

## US-012: Account Settings & Preferences
- `src/components/account/AccountSettings.tsx` (planned)
- `src/services/auth.service.ts`

---

*Diagrams to be completed in next step after code scan.*
