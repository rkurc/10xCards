import { z } from "zod";

/**
 * Schema for validating UUID parameters
 */
export const uuidSchema = z.object({
  id: z.string().uuid("Nieprawidłowy format identyfikatora"),
});

/**
 * Schema for validating card create command
 */
export const cardCreateSchema = z.object({
  front_content: z
    .string()
    .min(1, "Treść przedniej strony jest wymagana")
    .max(1000, "Treść przedniej strony nie może przekraczać 1000 znaków"),
  back_content: z
    .string()
    .min(1, "Treść tylnej strony jest wymagana")
    .max(10000, "Treść tylnej strony nie może przekraczać 10000 znaków"),
  source_type: z.enum(["MANUAL", "AI_GENERATED", "IMPORTED"]).default("MANUAL"),
});

/**
 * Schema for validating card update command
 */
export const cardUpdateSchema = z.object({
  front_content: z
    .string()
    .min(1, "Treść przedniej strony jest wymagana")
    .max(1000, "Treść przedniej strony nie może przekraczać 1000 znaków"),
  back_content: z
    .string()
    .min(1, "Treść tylnej strony jest wymagana")
    .max(10000, "Treść tylnej strony nie może przekraczać 10000 znaków"),
});
