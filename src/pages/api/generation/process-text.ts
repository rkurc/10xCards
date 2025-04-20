import type { APIContext } from "astro";
import { processTextSchema } from "../../../schemas/generation";
import { GenerationService } from "../../../services/generation.service";

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
    // Check if user is authenticated (using a fixed user ID for initial implementation)
    const userId = "test-user-id"; // In a real implementation, this would come from auth

    // Check rate limits
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = processTextSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: result.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If set_id is provided, verify that it exists and belongs to the user
    if (result.data.set_id) {
      const { data: cardSet, error } = await locals.supabase
        .from("card_sets")
        .select("id")
        .eq("id", result.data.set_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !cardSet) {
        return new Response(
          JSON.stringify({ error: "The specified card set does not exist or you do not have access to it" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Process the text
    const generationService = new GenerationService(locals.supabase);
    const result = await generationService.startTextProcessing(userId, result.data);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 202, // Accepted
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
