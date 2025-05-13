import { z } from "zod";

/**
 * Schema for validating text processing requests
 */
export const processTextSchema = z.object({
  text: z
    .string()
    .min(100, "Text must be at least 100 characters")
    .max(10000, "Text exceeds maximum length of 10,000 characters"),
  target_count: z.number().positive("Target count must be a positive number").optional(),
  set_id: z.string().uuid("Invalid set ID format").optional(),
});

/**
 * Schema for validating generation ID in path parameters
 * Allows both numeric timestamp IDs and UUIDs
 */
export const generationIdSchema = z.object({
  generation_id: z.string()
    .refine((val) => {
      // Accept both UUID and timestamp formats
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const timestampRegex = /^\d+$/;
      return uuidRegex.test(val) || timestampRegex.test(val);
    }, "Invalid generation ID format")
});

/**
 * Schema for validating card ID in path parameters
 */
export const cardIdSchema = z.object({
  card_id: z.string().uuid("Identyfikator fiszki musi być prawidłowym UUID"),
});

/**
 * Schema for validating both generation ID and card ID in path parameters
 */
export const generationCardParamsSchema = z.object({
  generation_id: z.string(),
  card_id: z.string().uuid("Identyfikator fiszki musi być prawidłowym UUID"),
});

/**
 * Schema for validating the finalize generation command
 */
export const finalizeGenerationSchema = z.object({
  name: z.string().min(1, "Nazwa zestawu jest wymagana").max(100, "Nazwa zestawu nie może przekraczać 100 znaków"),
  description: z.string().max(500, "Opis nie może przekraczać 500 znaków").optional(),
  accepted_cards: z
    .array(z.string().uuid("ID karty musi być prawidłowym UUID"))
    .min(1, "Przynajmniej jedna fiszka musi być zaakceptowana"),
});

/**
 * Schema for validating the accept card command
 */
export const acceptCardSchema = z.object({
  set_id: z.string().uuid("Identyfikator zestawu musi być prawidłowym UUID").optional(),
  front_content: z.string().max(200, "Treść przednia nie może przekraczać 200 znaków").optional(),
  back_content: z.string().max(500, "Treść tylna nie może przekraczać 500 znaków").optional(),
});

/**
 * Schema for validating the accept all cards command
 */
export const acceptAllSchema = z.object({
  set_id: z.string().uuid("Identyfikator zestawu musi być prawidłowym UUID").optional(),
});

/**
 * Type for the validated process text request
 */
export type ProcessTextRequest = z.infer<typeof processTextSchema>;

// Add aliases for backward compatibility
export const cardPathParamsSchema = cardIdSchema;
