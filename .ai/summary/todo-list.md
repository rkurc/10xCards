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
- ✅ `src/hooks/useCardSets.ts` - Updated with proper API call implementation including query parameters
- ✅ `src/hooks/useAuth.ts` - Removed (superseded by direct auth implementation)

### Components
- ✅ `src/components/review/ReviewContent.tsx` - State updates for cards have been implemented

### Services
- ✅ `src/services/generation.service.ts` - Fixed type casting issue with 'generation_results' table access

## Next Steps
1. ✅ Complete code improvement tasks (hooks, services, components) - Done!
2. ✅ Remove duplicate authentication implementations - Done!
3. 🔄 Implement the missing features in order of priority:
   - US-007: Generation Statistics
   - US-008: Readability Assessment  
   - US-011: Personal Data Management
4. Continue improving test coverage
