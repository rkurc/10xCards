import { SupabaseClient } from "../db/supabase.client";
import { Database } from "../db/database.types";
import { GenerationStartCommand, GenerationStartResponse, GenerationStatus } from "../types";
import { v4 as uuidv4 } from "uuid";

export class GenerationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Starts a flashcard generation process from the provided text
   * @param userId The ID of the requesting user
   * @param command The generation command containing text and options
   * @returns The generation ID and estimated processing time
   */
  async startTextProcessing(userId: string, command: GenerationStartCommand): Promise<GenerationStartResponse> {
    // Calculate estimated processing time based on text length (simplified)
    const estimatedTimeSeconds = Math.max(5, Math.ceil(command.text.length / 1000) * 2);

    // Generate a unique ID for this generation job
    const generationId = uuidv4();

    // Create a new generation log entry
    const { error } = await this.supabase.from("generation_logs").insert({
      id: generationId,
      user_id: userId,
      status: "pending" as GenerationStatus,
      source_text: command.text,
      target_count: command.target_count,
      set_id: command.set_id,
      estimated_time_seconds: estimatedTimeSeconds,
    });

    if (error) {
      throw new Error(`Failed to create generation log: ${error.message}`);
    }

    // In a real implementation, we would dispatch an asynchronous task here
    // For this implementation, we'll simulate it with a setTimeout
    setTimeout(() => this.processTextAsync(generationId), 100);

    return {
      generation_id: generationId,
      estimated_time_seconds: estimatedTimeSeconds,
    };
  }

  /**
   * Simulates asynchronous processing of the text
   * In a real implementation, this would be a background job
   */
  private async processTextAsync(generationId: string): Promise<void> {
    try {
      // Update status to processing
      await this.supabase.from("generation_logs").update({ status: "processing" }).eq("id", generationId);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // In a real implementation, we would call an AI service here
      // For now, we'll just mark it as completed
      await this.supabase.from("generation_logs").update({ status: "completed" }).eq("id", generationId);
    } catch (error) {
      console.error("Error processing text:", error);

      // Update status to failed
      await this.supabase
        .from("generation_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", generationId);
    }
  }
}
