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

export const generationIdSchema = z.object({
  generation_id: z.string().uuid("Identyfikator generacji musi być prawidłowym UUID"),
});

export const finalizeGenerationSchema = z.object({
  name: z.string().min(1, "Nazwa zestawu jest wymagana").max(100, "Nazwa zestawu nie może przekraczać 100 znaków"),
  description: z.string().max(500, "Opis nie może przekraczać 500 znaków").optional(),
  accepted_cards: z
    .array(z.string().uuid("ID karty musi być prawidłowym UUID"))
    .min(1, "Przynajmniej jedna fiszka musi być zaakceptowana"),
});

export const acceptCardSchema = z.object({
  card_id: z.string().uuid("Identyfikator fiszki musi być prawidłowym UUID"),
  generation_id: z.string().uuid("Identyfikator generacji musi być prawidłowym UUID"),
  front_content: z.string().max(200, "Treść przednia nie może przekraczać 200 znaków").optional(),
  back_content: z.string().max(500, "Treść tylna nie może przekraczać 500 znaków").optional(),
});

export const acceptAllSchema = z.object({
  set_id: z.string().uuid("Identyfikator zestawu musi być prawidłowym UUID"),
});

export const cardPathParamsSchema = z.object({
  card_id: z.string().uuid("Identyfikator fiszki musi być prawidłowym UUID"),
});

/**
 * Type for the validated process text request
 */
export type ProcessTextRequest = z.infer<typeof processTextSchema>;
