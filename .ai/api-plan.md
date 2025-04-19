# REST API Plan

## 1. Resources

The 10xCards API is organized around the following main resources:

- **Cards**: Individual flashcards with front and back content
- **Card Sets**: Collections of flashcards grouped by theme
- **Generations**: AI-generated flashcard creation process
- **Statistics**: Usage and performance metrics

## 2. Endpoints

### 2.1 Card Management

#### GET /api/cards
- **Description**: Get all user's cards
- **Query Parameters**:
  - `set_id` (optional): Filter by card set
  - `source_type` (optional): Filter by source type
  - `page` (optional): Page number for pagination
  - `limit` (optional): Number of items per page
  - `sort_by` (optional): Field to sort by
  - `sort_dir` (optional): Sort direction (asc/desc)
- **Response Body**:
```json
{
  "data": [
    {
      "id": "uuid",
      "front_content": "string",
      "back_content": "string",
      "source_type": "ai|ai_edited|manual",
      "readability_score": "number",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 400 Bad Request

#### POST /api/cards
- **Description**: Create a new card
- **Request Body**:
```json
{
  "front_content": "string",
  "back_content": "string",
  "source_type": "ai|ai_edited|manual",
  "set_id": "uuid" // Optional
}
```
- **Response Body**: Created card object
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized

#### GET /api/cards/{id}
- **Description**: Get a specific card
- **Response Body**: Card object
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PUT /api/cards/{id}
- **Description**: Update a card
- **Request Body**:
```json
{
  "front_content": "string",
  "back_content": "string"
}
```
- **Response Body**: Updated card object
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### DELETE /api/cards/{id}
- **Description**: Delete a card (soft delete)
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.3 Card Set Management

#### GET /api/card-sets
- **Description**: Get all user's card sets
- **Query Parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Number of items per page
- **Response Body**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "card_count": "number",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 400 Bad Request

#### POST /api/card-sets
- **Description**: Create a new card set
- **Request Body**:
```json
{
  "name": "string",
  "description": "string"
}
```
- **Response Body**: Created card set object
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized

#### GET /api/card-sets/{id}
- **Description**: Get a specific card set with its cards
- **Query Parameters**:
  - `page` (optional): Page number for cards pagination
  - `limit` (optional): Number of cards per page
- **Response Body**: 
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "cards": {
    "data": [
      {
        "id": "uuid",
        "front_content": "string",
        "back_content": "string",
        "source_type": "ai|ai_edited|manual",
        "readability_score": "number"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  }
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PUT /api/card-sets/{id}
- **Description**: Update a card set
- **Request Body**:
```json
{
  "name": "string",
  "description": "string"
}
```
- **Response Body**: Updated card set object
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### DELETE /api/card-sets/{id}
- **Description**: Delete a card set (soft delete)
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### POST /api/card-sets/{id}/cards
- **Description**: Add cards to a set
- **Request Body**:
```json
{
  "card_ids": ["uuid"]
}
```
- **Response Body**: 
```json
{
  "added_count": "number"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### DELETE /api/card-sets/{id}/cards/{card_id}
- **Description**: Remove a card from a set
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.4 AI Flashcard Generation

#### POST /api/generation/process-text
- **Description**: Submit text for flashcard proposals generation
- **Request Body**:
```json
{
  "text": "string",
  "target_count": "number", // Optional, desired number of cards
  "set_id": "uuid" // Optional, assign to set
}
```
- **Response Body**:
```json
{
  "generation_id": "uuid",
  "estimated_time_seconds": "number"
}
```
- **Success Codes**: 202 Accepted
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 429 Too Many Requests

#### GET /api/generation/{generation_id}/status
- **Description**: Check status of proposals generation job
- **Response Body**:
```json
{
  "status": "pending|processing|completed|failed",
  "progress": "number", // 0-100
  "error": "string" // Only if failed
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### GET /api/generation/{generation_id}/results
- **Description**: Get generated flashcard proposals
- **Response Body**:
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
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### POST /api/generation/{generation_id}/accept
- **Description**: Accept all generated flashcard proposals
- **Request Body**:
```json
{
  "set_id": "uuid" // Optional, assign to set
}
```
- **Response Body**:
```json
{
  "accepted_count": "number",
  "card_ids": ["uuid"]
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### POST /api/generation/{generation_id}/cards/{card_id}/accept
- **Description**: Accept a specific generated flashcard
- **Request Body**:
```json
{
  "set_id": "uuid", // Optional, assign to set
  "front_content": "string", // Optional, edit before accepting
  "back_content": "string" // Optional, edit before accepting
}
```
- **Response Body**: Created card object
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### POST /api/generation/{generation_id}/cards/{card_id}/reject
- **Description**: Reject a specific generated flashcard
- **Success Codes**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.7 Statistics

#### GET /api/statistics/generation
- **Description**: Get flashcard generation statistics
- **Query Parameters**:
  - `period` (optional): "day", "week", "month", "year"
- **Response Body**:
```json
{
  "total_generated": "number",
  "accepted_unedited": "number",
  "accepted_edited": "number",
  "rejected": "number",
  "acceptance_rate": "number",
  "average_generation_time": "number",
  "history": [
    {
      "date": "string",
      "generated": "number",
      "accepted": "number"
    }
  ]
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized

## 3. Authentication and Authorization

The 10xCards API uses Supabase Authentication for handling user authentication. All API endpoints (except public ones) require authentication.

### Authentication Methods

- **JWT Token**: The primary authentication method uses JWT tokens provided by Supabase Auth
- **Headers**: Include `Authorization: Bearer <token>` in API requests
- **Cookie Authentication**: For web client usage

### Authorization Rules

1. **Resource Ownership**: Users can only access their own resources (cards, sets, etc.)
2. **Row-Level Security**: Enforced at the database level through Supabase RLS policies
3. **Permission Model**:
   - Regular users have full access to their own data
   - Admin users (future expansion) may have additional capabilities

## 4. Validation and Business Logic

### 4.1 Data Validation Rules

- **Card Content**:
  - Front content: Maximum 200 characters
  - Back content: Maximum 500 characters
- **Card Set**:
  - Name: Maximum 100 characters
- **Enum Values**:
  - Source type: Must be one of 'ai', 'ai_edited', 'manual'
  - Knowledge status: Must be one of 'new', 'learning', 'review', 'mastered'
- **Text for AI Generation**:
  - Minimum length: 100 characters
  - Maximum length: 10,000 characters

### 4.2 Business Logic Rules

- **Card Generation**:
  - Rate limited to prevent abuse
  - Generation logs tracked for user statistics
  - Results expire after 7 days if not accepted
- **Spaced Repetition**:
  - Cards progress through knowledge statuses based on user responses
  - Intervals calculated using a standard spaced repetition algorithm
  - Next review dates automatically updated after each response
- **Soft Deletion**:
  - Cards and sets use soft deletion (is_deleted flag)
  - All API endpoints filter out soft-deleted items
- **Card Assignment**:
  - When adding a card to a set, both must exist and belong to same user
- **GDPR Compliance**:
  - Complete data export provided in structured format
  - Account deletion includes all user data and associations

### 4.3 Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {} // Optional additional information
  }
}
```

Common error codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (e.g., duplicate username)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error
