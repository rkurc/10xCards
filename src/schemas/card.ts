import { z } from "zod";

/**
 * Schema for validating UUID parameters
 */
export const uuidSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * Schema for validating card create command
 */
export const cardCreateSchema = z.object({
  front_content: z
    .string()
    .min(1, "Treść przedniej strony jest wymagana")
    .max(200, "Treść przedniej strony nie może przekraczać 200 znaków"),
  back_content: z
    .string()
    .min(1, "Treść tylnej strony jest wymagana")
    .max(500, "Treść tylnej strony nie może przekraczać 500 znaków"),
  source_type: z.enum(["manual", "ai", "ai_edited"]).default("manual"),
});

/**
 * Schema for validating card update command
 */
export const cardUpdateSchema = z.object({
  front_content: z
    .string()
    .min(1, "Treść przedniej strony jest wymagana")
    .max(200, "Treść przedniej strony nie może przekraczać 200 znaków"),
  back_content: z
    .string()
    .min(1, "Treść tylnej strony jest wymagana")
    .max(500, "Treść tylnej strony nie może przekraczać 500 znaków"),
});
