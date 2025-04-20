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
 * Type for the validated process text request
 */
export type ProcessTextRequest = z.infer<typeof processTextSchema>;
