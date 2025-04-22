import { z } from "zod";

export const generationResultParamsSchema = z.object({
  generation_id: z.string().uuid(),
});

export const generationAcceptCommandSchema = z.object({
  set_id: z.string().uuid().optional(),
});

export const generationCardAcceptCommandSchema = z.object({
  set_id: z.string().uuid().optional(),
  front_content: z.string().max(200).optional(),
  back_content: z.string().max(500).optional()
});

export const generationCardParamsSchema = z.object({
  generation_id: z.string().uuid(),
  card_id: z.string().uuid()
});
