# API Endpoint Implementation Plan: POST /api/generation/process-text

## 1. Overview of the Endpoint
This endpoint allows users to submit text for AI-powered flashcard generation. It initiates an asynchronous process that analyzes the provided text and generates flashcard proposals. The endpoint returns immediately with a generation ID that can be used to check status and retrieve results.

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/api/generation/process-text`
- **Parameters**:
  - **Required**: None (in URL)
  - **Optional**: None (in URL)
- **Request Body**:
  ```typescript
  {
    "text": string,             // Required: Text to generate flashcards from
    "target_count"?: number,    // Optional: Desired number of flashcards
    "set_id"?: string           // Optional: UUID of card set to assign cards to
  }
  ```

## 3. Types Used
- **Request Types**:
  - `GenerationStartCommand` - Command model for the request
- **Response Types**:
  - `GenerationStartResponse` - DTO for the response
- **Internal Types**:
  - `Database['public']['Tables']['generation_logs']['Insert']` - For logging the generation request
  - `GenerationStatus` - For tracking the status of the generation job

## 4. Response Details
- **Success Response (Status 202 Accepted)**:
  ```typescript
  {
    "generation_id": string,        // UUID for tracking the generation job
    "estimated_time_seconds": number // Estimated processing time
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Invalid input data
  - 401 Unauthorized: User not authenticated
  - 429 Too Many Requests: Rate limit exceeded
  - 500 Internal Server Error: Server-side processing error

## 5. Data Flow
1. **Client Request**: Client sends text and optional parameters
2. **Authentication**: Use a defined user ID instead of Supabase auth (for initial implementation)
3. **Controller**: Accepts the request and validates inputs
4. **Service Layer**:
   - Creates a new generation job with status "pending"
   - Calculates estimated processing time based on text length
   - Creates an entry in generation_logs table
   - Dispatches an asynchronous task to process the text
5. **Mock AI Processing**:
   - Updates job status to "processing" 
   - Uses a mock strategy to generate flashcard proposals (no actual AI integration)
   - Simulates processing delay with a short timeout
   - Stores the generated proposals temporarily
   - Updates job status to "completed" (or "failed" if error occurs)
6. **Response**: Returns the generation_id and estimated_time_seconds to client

## 6. Security Considerations
1. **Authentication**:
   - For initial implementation, use a defined user ID
   - Plan for future integration with proper authentication system

2. **Authorization**:
   - Ensure generation logs and results are only accessible to the creating user
   - Use basic authorization checks based on user ID

3. **Input Validation**:
   - Validate text meets length requirements (100-10,000 characters)
   - Validate target_count is a positive integer if provided
   - Verify set_id exists and belongs to the requesting user if provided

4. **Rate Limiting**:
   - Implement basic rate limiting for testing purposes
   - Return 429 status when limits are exceeded

## 7. Error Handling
1. **Validation Errors**:
   - Return 400 Bad Request with detailed error messages
   - Examples:
     - Text too short: "Text must be at least 100 characters"
     - Text too long: "Text exceeds maximum length of 10,000 characters"
     - Invalid target_count: "Target count must be a positive number"

2. **Authentication Errors**:
   - Return 401 Unauthorized when no user ID is provided

3. **Authorization Errors**:
   - Return 403 Forbidden if user tries to use another user's set_id

4. **Resource Errors**:
   - Return 404 Not Found if specified set_id doesn't exist

5. **Rate Limiting Errors**:
   - Return 429 Too Many Requests with basic information

6. **Service Failures**:
   - Return 500 Internal Server Error for mock AI service failures
   - Log detailed error information for debugging

## 8. Implementation Steps

### 1. Setup Directory Structure
