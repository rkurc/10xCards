import type { APIContext } from "astro";
import { processTextSchema } from "../../../schemas/generation";
import { GenerationService } from "../../../services/generation.service";
import { requireAuth, createApiResponse, createApiError } from "../../../utils/api-auth";

export const prerender = false;

/**
 * Rate limit information by user
 */
const userRateLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * Rate limit config
 */
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_MS: 60000, // 1 minute
};

export async function POST({ request, locals }: APIContext) {
  try {
    // Check authentication
    const authResponse = requireAuth({ locals, request });
    if (authResponse) return authResponse;

    // Use the authenticated user's ID
    const userId = locals.user.id;

    // Check rate limits
    if (!checkRateLimit(userId)) {
      return createApiError({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded. Try again later.",
        status: 429
      });
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const result = processTextSchema.safeParse(body);

    if (!result.success) {
      return createApiError({
        code: "INVALID_REQUEST",
        message: "Invalid request data",
        details: result.error.format(),
        status: 400
      });
    }

    // If set_id is provided, verify that it exists and belongs to the user
    if (result.data.set_id) {
      try {
        const { data: cardSet, error } = await locals.supabase
          .from("card_sets")
          .select("id")
          .eq("id", result.data.set_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        
        if (!cardSet) {
          return createApiError({
            code: "FORBIDDEN",
            message: "The specified card set does not exist or you do not have access to it",
            status: 403
          });
        }
      } catch (error) {
        console.error("Database error checking card set:", error);
        return createApiError(error, 500);
      }
    }

    // Process the text
    try {
      const generationService = new GenerationService(locals.supabase);
      const processingResult = await generationService.startTextProcessing(userId, result.data);

      // Return success response
      return createApiResponse(processingResult, 202); // Accepted
    } catch (error) {
      console.error("Error in generation service:", error);
      return createApiError(error, 500);
    }
  } catch (error) {
    console.error("Unhandled error processing request:", error);
    return createApiError("Internal server error", 500);
  }
}

/**
 * Check and update rate limit for a user
 * @param userId User ID to check rate limit for
 * @returns Whether the request is allowed
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();

  if (!userRateLimits[userId] || userRateLimits[userId].resetAt < now) {
    // Initialize or reset rate limit
    userRateLimits[userId] = { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS };
    return true;
  }

  if (userRateLimits[userId].count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }

  userRateLimits[userId].count++;
  return true;
}
