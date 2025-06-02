# 10xCards Sequence Diagrams

*For each use case, describe the main sequence of interactions (user, UI, service, DB, etc). Use Mermaid syntax for diagrams.*

## US-001: Automatic Flashcard Generation
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant GenerationService
    participant OpenRouterService
    participant DB
    User->>UI: Paste text, click Generate
    UI->>API: POST /api/generation/process-text
    API->>GenerationService: startGeneration(text)
    GenerationService->>OpenRouterService: generateFlashcards(text)
    OpenRouterService->>OpenRouter.ai: API call
    OpenRouter.ai-->>OpenRouterService: flashcard proposals
    OpenRouterService-->>GenerationService: proposals
    GenerationService->>DB: store proposals
    GenerationService-->>API: GenerationResult
    API-->>UI: Show generated cards
    UI-->>User: Display cards for review
```

## US-002: Manual Flashcard Management
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant CardService
    participant DB
    User->>UI: Create/Edit/Delete card
    UI->>API: POST/PUT/DELETE /api/cards
    API->>CardService: createCard/updateCard/deleteCard
    CardService->>DB: update cards table
    CardService-->>API: result
    API-->>UI: update card list
    UI-->>User: show updated cards
```

## US-003: User Registration & Login
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant AuthService
    participant Supabase
    User->>UI: Register/Login
    UI->>AuthService: register/login
    AuthService->>Supabase: auth API
    Supabase-->>AuthService: result
    AuthService-->>UI: auth result
    UI-->>User: show login/register result
```

## US-009: Card Set Management
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant CardSetService
    participant DB
    User->>UI: Create/Edit/Delete set
    UI->>API: POST/PUT/DELETE /api/card-sets
    API->>CardSetService: createCardSet/updateCardSet/deleteCardSet
    CardSetService->>DB: update card_sets table
    CardSetService-->>API: result
    API-->>UI: update set list
    UI-->>User: show updated sets
```

## US-006: Accept/Reject Generated Cards
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant GenerationService
    participant DB
    User->>UI: Accept/Reject/Edit card
    UI->>API: POST /api/generation/[generation_id]/cards/[card_id]/accept|reject
    API->>GenerationService: acceptCard/rejectCard
    GenerationService->>DB: update generation results
    GenerationService-->>API: result
    API-->>UI: update card list
    UI-->>User: show updated cards
```

## US-007: Generation Statistics
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant GenerationService
    participant DB
    User->>UI: View statistics
    UI->>API: GET /api/generation/[generation_id]/results
    API->>GenerationService: getGenerationResults
    GenerationService->>DB: query statistics
    GenerationService-->>API: stats
    API-->>UI: show stats
    UI-->>User: display statistics
```

## US-008: Readability Assessment
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant OpenRouterService
    User->>UI: Edit card
    UI->>OpenRouterService: assessReadability(text)
    OpenRouterService-->>UI: readability score, suggestions
    UI-->>User: show readability info
```

## US-010: Error Handling for Generation
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Service
    User->>UI: Trigger error (e.g. bad input)
    UI->>API: request
    API->>Service: process
    Service-->>API: error
    API-->>UI: error message
    UI-->>User: show error notification
```

## US-011: Personal Data Management
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant AuthService
    participant DB
    User->>UI: Export/Delete data
    UI->>API: GET/DELETE /api/user/export|delete
    API->>AuthService: exportData/deleteAccount
    AuthService->>DB: query/delete user data
    AuthService-->>API: result
    API-->>UI: show result
    UI-->>User: display confirmation
```

## US-012: Account Settings & Preferences
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant AuthService
    participant DB
    User->>UI: Change settings
    UI->>API: PUT /api/user/settings
    API->>AuthService: updateSettings
    AuthService->>DB: update user record
    AuthService-->>API: result
    API-->>UI: show result
    UI-->>User: display updated settings
```

---

*Diagrams for all main use cases, with planned/incomplete flows marked as needed.*
