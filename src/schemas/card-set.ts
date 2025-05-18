import { z } from "zod";

/**
 * Schema for validating pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Numer strony musi być liczbą całkowitą")
    .min(1, "Numer strony musi być większy od 0")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit elementów na stronę musi być liczbą całkowitą")
    .min(1, "Limit elementów na stronę musi być większy od 0")
    .max(100, "Limit elementów na stronę nie może przekraczać 100")
    .default(10),
});

/**
 * Schema for validating UUID parameters
 * Uses basic string validation for test compatibility
 */
export const uuidSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * Schema for validating card UUID parameters
 */
export const cardIdSchema = z.object({
  card_id: z.string().min(1, "Card ID is required"),
});

/**
 * Schema for validating card set create/update command
 */
export const cardSetCommandSchema = z.object({
  name: z.string().min(1, "Nazwa zestawu jest wymagana").max(100, "Nazwa zestawu nie może przekraczać 100 znaków"),
  description: z.string().max(500, "Opis nie może przekraczać 500 znaków").optional(),
});

/**
 * Schema for validating add cards to set command
 */
export const addCardsToSetSchema = z.object({
  card_ids: z
    .array(z.string().uuid("Identyfikator fiszki musi być prawidłowym UUID"))
    .min(1, "Przynajmniej jedna fiszka musi być wybrana"),
});
