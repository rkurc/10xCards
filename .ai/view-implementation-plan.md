# API Endpoints Implementation Plan: Flashcard Generation Results

## 1. Endpoints Overview

This implementation plan covers five related endpoints that allow users to retrieve and manage generated flashcard proposals:

1. **GET /api/generation/{generation_id}/results**: Retrieves the generated flashcard proposals for a specific generation job
2. **POST /api/generation/{generation_id}/accept**: Accepts all generated flashcard proposals at once, optionally adding them to a set
3. **POST /api/generation/{generation_id}/cards/{card_id}/accept**: Accepts a specific generated flashcard, possibly with edits, optionally adding it to a set
4. **POST /api/generation/{generation_id}/cards/{card_id}/reject**: Rejects a specific generated flashcard
5. **POST /api/generation/{generation_id}/finalize**: Finalizes the generation process by naming and creating a new set from accepted cards

These endpoints work together to provide a complete flow for handling AI-generated flashcard proposals, allowing users to review, accept (with or without edits), or reject them, and ultimately create a named set.

## 2. Request Details

### 2.1 GET /api/generation/{generation_id}/results

- **Method**: GET
- **URL Pattern**: `/api/generation/{generation_id}/results`
- **Path Parameters**:
  - `generation_id` (required): UUID of the generation job
- **Query Parameters**: None
- **Request Body**: None

### 2.2 POST /api/generation/{generation_id}/accept

- **Method**: POST
- **URL Pattern**: `/api/generation/{generation_id}/accept`
- **Path Parameters**:
  - `generation_id` (required): UUID of the generation job
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "set_id": "uuid" // Optional, assign to set
  }
  ```

### 2.3 POST /api/generation/{generation_id}/cards/{card_id}/accept

- **Method**: POST
- **URL Pattern**: `/api/generation/{generation_id}/cards/{card_id}/accept`
- **Path Parameters**:
  - `generation_id` (required): UUID of the generation job
  - `card_id` (required): UUID of the specific generated flashcard
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "set_id": "uuid", // Optional, assign to set
    "front_content": "string", // Optional, edit before accepting
    "back_content": "string" // Optional, edit before accepting
  }
  ```

### 2.4 POST /api/generation/{generation_id}/cards/{card_id}/reject

- **Method**: POST
- **URL Pattern**: `/api/generation/{generation_id}/cards/{card_id}/reject`
- **Path Parameters**:
  - `generation_id` (required): UUID of the generation job
  - `card_id` (required): UUID of the specific generated flashcard
- **Query Parameters**: None
- **Request Body**: None

### 2.5 POST /api/generation/{generation_id}/finalize

- **Method**: POST
- **URL Pattern**: `/api/generation/{generation_id}/finalize`
- **Path Parameters**:
  - `generation_id` (required): UUID of the generation job
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string", // Optional
    "accepted_cards": ["uuid"]
  }
  ```

## 3. Required Types

The implementation will use the following types defined in `types.ts`:

- **GenerationCardDTO**: Represents a generated flashcard proposal
- **GenerationResultResponse**: Response structure for the results endpoint
- **GenerationAcceptAllCommand**: Command for accepting all flashcards
- **GenerationAcceptAllResponse**: Response after accepting all flashcards
- **GenerationCardAcceptCommand**: Command for accepting a specific flashcard
- **CardDTO**: Represents a card as returned by the API
- **GenerationFinalizeCommand**: Command for finalizing the generation process and creating a new set
- **GenerationFinalizeResponse**: Response after finalizing the generation process

## 4. Response Details

### 4.1 GET /api/generation/{generation_id}/results

- **Success Response** (200 OK):
  ```json
  {
    "cards": [
      {
        "id": "uuid",
        "front_content": "string",
        "back_content": "string",
        "readability_score": "number"
      }
    ],
    "stats": {
      "text_length": "number",
      "generated_count": "number",
      "generation_time_ms": "number"
    }
  }
  ```
- **Error Responses**:
  - 401 Unauthorized: User is not authenticated
  - 404 Not Found: Generation job not found or doesn't belong to the user

### 4.2 POST /api/generation/{generation_id}/accept

- **Success Response** (200 OK):
  ```json
  {
    "accepted_count": "number",
    "card_ids": ["uuid"]
  }
  ```
- **Error Responses**:
  - 401 Unauthorized: User is not authenticated
  - 404 Not Found: Generation job not found or doesn't belong to the user

### 4.3 POST /api/generation/{generation_id}/cards/{card_id}/accept

- **Success Response** (201 Created): Complete CardDTO object
- **Error Responses**:
  - 400 Bad Request: Invalid input (e.g., content length exceeds limits)
  - 401 Unauthorized: User is not authenticated
  - 404 Not Found: Generation job or card not found or doesn't belong to the user

### 4.4 POST /api/generation/{generation_id}/cards/{card_id}/reject

- **Success Response** (204 No Content)
- **Error Responses**:
  - 401 Unauthorized: User is not authenticated
  - 404 Not Found: Generation job or card not found or doesn't belong to the user

### 4.5 POST /api/generation/{generation_id}/finalize

- **Success Response** (201 Created):
  ```json
  {
    "set_id": "uuid",
    "name": "string",
    "card_count": "number"
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Invalid input (e.g., missing required fields)
  - 401 Unauthorized: User is not authenticated
  - 404 Not Found: Generation job not found or doesn't belong to the user

## 5. Data Flow

### 5.1 GET /api/generation/{generation_id}/results

1. Extract `generation_id` from the URL path
2. Extract user UUID from the request (header or session)
3. Validate that the generation job exists and belongs to the user
4. Query the `generation_results` table to get all card proposals for the generation job
5. Query the `generation_logs` table to get metadata about the generation process
6. Format the response according to the `GenerationResultResponse` type
7. Return the response with status code 200

### 5.2 POST /api/generation/{generation_id}/accept

1. Extract `generation_id` from the URL path
2. Extract user UUID from the request (header or session)
3. Extract optional `set_id` from request body
4. Validate that the generation job exists and belongs to the user
5. If `set_id` is provided, validate that the set exists and belongs to the user
6. Query the `generation_results` table to get all card proposals for the generation job
7. For each proposal:
   a. Create a new record in the `cards` table with user ownership
   b. If `set_id` is provided, create a link in `cards_to_sets` table
8. Update statistics in the `generation_logs` table
9. Return the list of created card IDs and the count

### 5.3 POST /api/generation/{generation_id}/cards/{card_id}/accept

1. Extract `generation_id` and `card_id` from the URL path
2. Extract user UUID from the request (header or session)
3. Extract optional fields from request body: `set_id`, `front_content`, `back_content`
4. Validate that the generation job exists and belongs to the user
5. Validate that the card proposal exists in the generation results
6. If `set_id` is provided, validate that the set exists and belongs to the user
7. Create a new card record in the `cards` table with content from the request body (if provided) or from the original proposal
8. If `set_id` is provided, create a link in `cards_to_sets` table
9. Update generation statistics in `generation_logs` table (increment accepted_edited_count or accepted_unedited_count)
10. Return the created card with status code 201

### 5.4 POST /api/generation/{generation_id}/cards/{card_id}/reject

1. Extract `generation_id` and `card_id` from the URL path
2. Extract user UUID from the request (header or session)
3. Validate that the generation job exists and belongs to the user
4. Validate that the card proposal exists in the generation results
5. Mark the card as rejected (either with a status flag or by removing it, depending on implementation)
6. Update rejection statistics in the `generation_logs` table
7. Return status code 204 (No Content)

### 5.5 POST /api/generation/{generation_id}/finalize

1. Extract `generation_id` from the URL path
2. Extract user UUID from the request (header or session)
3. Extract required fields from request body: `name`, `accepted_cards`, and optional `description`
4. Validate that the generation job exists and belongs to the user
5. Validate that all card IDs in `accepted_cards` belong to the generation job
6. Create a new card set record in the `card_sets` table with the provided name and description
7. For each accepted card:
   a. Create a new record in the `cards` table with user ownership
   b. Create a link in `cards_to_sets` table to associate with the new set
8. Update generation statistics in the `generation_logs` table
9. Permanently delete rejected cards from the generation results
10. Return the created set ID, name, and card count with status code 201

## 6. Security Considerations

1. **Authentication**:
   - All endpoints require a valid user UUID
   - User UUID should be extracted from a request header (e.g., `X-User-ID`) or from session data
   - In a production environment, proper authentication (like JWT) should be implemented

2. **Authorization**:
   - Validate that the user is accessing only their own generation jobs by comparing the user UUID with the owner of the resource
   - When using `set_id`, validate that the set belongs to the authenticated user
   - Implement database-level checks to ensure users can only access their own data

3. **Input Validation**:
   - Validate `generation_id`, `card_id`, and user UUID as valid UUIDs
   - Validate `set_id` as a valid UUID if provided
   - Check content length constraints for card content (front ≤ 200 chars, back ≤ 500 chars)
   - Use zod schemas for request validation

4. **Data Integrity**:
   - Maintain proper transaction boundaries when updating multiple tables
   - Ensure atomicity when accepting cards and updating statistics

## 7. Error Handling

### Potential Error Scenarios

1. **Generation Not Found**:
   - Status Code: 404 Not Found
   - Response: `{ "error": "Generation job not found" }`

2. **Card Not Found**:
   - Status Code: 404 Not Found
   - Response: `{ "error": "Generated card not found" }`

3. **Content Too Long**:
   - Status Code: 400 Bad Request
   - Response: `{ "error": "Front content exceeds maximum length of 200 characters" }`
   - Response: `{ "error": "Back content exceeds maximum length of 500 characters" }`

4. **Invalid Set**:
   - Status Code: 404 Not Found
   - Response: `{ "error": "Card set not found" }`

5. **Unauthorized Access**:
   - Status Code: 401 Unauthorized
   - Response: `{ "error": "Authentication required" }`

6. **Access Other User's Data**:
   - Status Code: 403 Forbidden
   - Response: `{ "error": "Access denied" }`

7. **Database Error**:
   - Status Code: 500 Internal Server Error
   - Response: `{ "error": "An error occurred while processing your request" }`
   - Log detailed error information server-side

8. **Missing Set Name**:
   - Status Code: 400 Bad Request
   - Response: `{ "error": "Set name is required" }`

9. **Empty Card Selection**:
   - Status Code: 400 Bad Request
   - Response: `{ "error": "At least one card must be selected" }`

## 8. Performance Considerations

1. **Database Queries**:
   - Use appropriate indexes on `generation_id` and `card_id`
   - Consider pagination for large result sets
   - Use batch operations when accepting multiple cards

2. **Concurrency**:
   - Handle concurrent acceptance/rejection of cards with database transactions
   - Use optimistic concurrency control when appropriate

## 9. Implementation Steps

### 9.1 Results Endpoint

1. Create a new file at `/src/pages/api/generation/[generation_id]/results.ts`
2. Extract user UUID from request headers or session
3. Add validation for the `generation_id` parameter
4. Create a method in GenerationService to fetch generation results
5. Return properly formatted JSON response

### 9.2 Accept All Endpoint

1. Create a new file at `/src/pages/api/generation/[generation_id]/accept.ts`
2. Extract user UUID from request headers or session
3. Add validation for the request body using zod schema
4. Create a method in GenerationService to accept all flashcards
5. Update generation statistics appropriately
6. Return the list of created card IDs

### 9.3 Accept Specific Card Endpoint

1. Create a new file at `/src/pages/api/generation/[generation_id]/cards/[card_id]/accept.ts`
2. Extract user UUID from request headers or session
3. Add validation for the request body using zod schema
4. Create a method in GenerationService to accept a specific flashcard
5. Update generation statistics appropriately
6. Return the created card object

### 9.4 Reject Specific Card Endpoint

1. Create a new file at `/src/pages/api/generation/[generation_id]/cards/[card_id]/reject.ts`
2. Extract user UUID from request headers or session
3. Add validation for path parameters
4. Create a method in GenerationService to reject a specific flashcard
5. Update generation statistics appropriately
6. Return a 204 No Content response

### 9.5 Finalize Generation Endpoint

1. Create a new file at `/src/pages/api/generation/[generation_id]/finalize.ts`
2. Extract user UUID from request headers or session
3. Add validation for the request body using zod schema (require name and accepted_cards array)
4. Create a method in GenerationService to finalize the generation process
5. Create a new card set and add accepted cards to it
6. Update generation statistics appropriately
7. Delete rejected cards
8. Return the created set information

### 9.6 Service Layer Methods

1. Extend the existing `GenerationService` class with the following methods:
   - `getGenerationResults(userId: string, generationId: string): Promise<GenerationResultResponse>`
   - `acceptAllCards(userId: string, generationId: string, command: GenerationAcceptAllCommand): Promise<GenerationAcceptAllResponse>`
   - `acceptCard(userId: string, generationId: string, cardId: string, command: GenerationCardAcceptCommand): Promise<CardDTO>`
   - `rejectCard(userId: string, generationId: string, cardId: string): Promise<void>`
   - `finalizeGeneration(userId: string, generationId: string, command: GenerationFinalizeCommand): Promise<GenerationFinalizeResponse>`

## 10. Dependencies

1. `zod`: For request validation
2. `@supabase/supabase-js`: For database operations and authentication
3. Existing types from `src/types.ts`
4. Existing service from `src/services/generation.service.ts`

## 11. Checklist

- [ ] Implement all five endpoints
- [ ] Add user UUID checking for authorization
- [ ] Implement robust error handling
- [ ] Add input validation using zod
- [ ] Update generation statistics after actions
- [ ] Add comprehensive unit tests
- [ ] Document API endpoints
- [ ] Optimize database queries
