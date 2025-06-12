# 10xCards: Pending Features

This document lists all pending features and improvements that need to be implemented in the 10xCards application. Each item is tagged with the related user story and includes a reference to the relevant file where a TODO comment has been added.

## Feature Implementation TODOs

### US-007: Generation Statistics
**Status: Not Implemented**
- Add statistics dashboard functionality
- Track number of generated and accepted cards
- Implement real-time statistics updates
- File: `src/components/dashboard/DashboardContent.tsx`

### US-008: Readability Assessment
**Status: Not Implemented**
- Implement text analysis for readability score (FOG index)
- Display readability metrics to user
- Add suggestions for text improvement
- File: `src/components/generate/GenerateContent.tsx`

### US-011: Personal Data Management
**Status: Not Implemented**
- Add user profile settings
- Implement data export functionality for GDPR compliance
- Add account deletion option that removes all user data
- Files: 
  - `src/components/auth/UserMenu.tsx`
  - `src/components/account/ProfileContent.tsx`

## Code Improvement TODOs

### Hooks
- `src/hooks/useCardSets.ts` - Replace placeholder with actual API call
- `src/hooks/useAuth.ts` - Add necessary side effects based on auth state changes

### Components
- `src/components/review/ReviewContent.tsx` - Add state updates for cards

### Services
- `src/services/generation.service.ts` - Fix type casting after regenerating Supabase types

## Next Steps
1. Implement the missing features in order of priority
2. Remove duplicate authentication implementations (context-based vs. direct auth)
3. Clean up tests and improve test coverage
