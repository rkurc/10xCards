import { SupabaseClient } from "../db/supabase.client";
import { Database } from "../db/database.types";
import { GenerationCardDTO, GenerationStartCommand, GenerationStartResponse, GenerationStatus } from "../types";

export class GenerationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Starts a flashcard generation process from the provided text
   * @param userId The ID of the requesting user
   * @param command The generation command containing text and options
   * @returns The generation ID and estimated processing time
   */
  async startTextProcessing(userId: string, command: GenerationStartCommand): Promise<GenerationStartResponse> {
    // print user id and command details
    console.log("User ID:", userId);
    console.log("Command Details:", command);
    

    // Calculate estimated processing time based on text length (simplified)
    const estimatedTimeSeconds = Math.max(5, Math.ceil(command.text.length / 1000) * 2);

    // Create a new generation log entry
    // Note: We're not specifying the ID since it's a bigserial in the database
    const { data, error } = await this.supabase
      .from("generation_logs")
      .insert({
        user_id: userId,
        status: "pending" as GenerationStatus,
        source_text: command.text,
        target_count: command.target_count,
        set_id: command.set_id,
        estimated_time_seconds: estimatedTimeSeconds,
        // Additional fields from original schema
        model: "mock-model-v1",
        source_text_length: command.text.length,
        source_text_hash: this.hashText(command.text),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create generation log: ${error?.message || "Unknown error"}`);
    }

    // Dispatch an asynchronous task to process the text
    // Using setTimeout to simulate asynchronous processing
    setTimeout(() => this.processTextAsync(data.id.toString()), 100);

    return {
      generation_id: data.id.toString(), // Convert bigint to string
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

      // Get the generation log to access text and options
      const { data: generationLog, error: logError } = await this.supabase
        .from("generation_logs")
        .select("*")
        .eq("id", generationId)
        .single();

      if (logError || !generationLog) {
        throw new Error(`Failed to retrieve generation log: ${logError?.message || "Record not found"}`);
      }

      // Simulate processing delay based on text length
      const processingDelay = Math.min(5000, Math.max(2000, generationLog.source_text.length / 100));
      await new Promise((resolve) => setTimeout(resolve, processingDelay));

      // Generate mock flashcards
      const generatedCards = this.generateMockFlashcards(
        generationLog.source_text,
        generationLog.target_count || this.calculateDefaultCardCount(generationLog.source_text)
      );

      // Store the generated cards in the database
      const cardInserts = generatedCards.map((card) => ({
        id: this.generateUUID(),
        generation_id: generationId,
        front_content: card.front_content,
        back_content: card.back_content,
        readability_score: card.readability_score,
      }));

      const { error: insertError } = await this.supabase.from("generation_results").insert(cardInserts);

      if (insertError) {
        throw new Error(`Failed to store generated cards: ${insertError.message}`);
      }

      // Update generation log with completion status
      await this.supabase
        .from("generation_logs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);
    } catch (error) {
      console.error("Error processing text:", error);

      // Update status to failed
      await this.supabase
        .from("generation_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);
    }
  }

  /**
   * Generates mock flashcards based on input text
   * In a real implementation, this would use an AI service
   */
  private generateMockFlashcards(text: string, targetCount: number): GenerationCardDTO[] {
    const sentences = this.extractSentences(text);
    const cards: GenerationCardDTO[] = [];

    // Generate up to targetCount cards, but limited by available content
    const actualCount = Math.min(targetCount, Math.floor(sentences.length / 2));
    // print actualCount
    console.log("Actual card count:", actualCount);
    for (let i = 0; i < actualCount; i++) {
      // Create a card with front and back content
      const frontSentence = sentences[i * 2];
      const backSentence = sentences[i * 2 + 1] || "No additional context available.";

      cards.push({
        id: this.generateUUID(),
        front_content: this.createFrontContent(frontSentence, i),
        back_content: this.createBackContent(backSentence, i),
        readability_score: this.calculateReadabilityScore(frontSentence + " " + backSentence),
      });
    }

    return cards;
  }

  /**
   * Extracts sentences from text to use for flashcard generation
   */
  private extractSentences(text: string): string[] {
    // Simple sentence splitting (could be improved in a real implementation)
    return text
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 10); // Only use sentences of sufficient length
  }

  /**
   * Creates front content for a flashcard
   */
  private createFrontContent(sentence: string, index: number): string {
    // For mock purposes, we'll create a question from the sentence
    const keywords = ["What", "Why", "How", "Explain", "Define"];
    const keyword = keywords[index % keywords.length];

    // Extract a key concept from the sentence (simplified)
    const words = sentence.split(" ");
    const keyWord = words.find((w) => w.length > 5) || words[Math.floor(words.length / 2)];

    return `${keyword} is ${keyWord}?`;
  }

  /**
   * Creates back content for a flashcard
   */
  private createBackContent(sentence: string, index: number): string {
    // For mock purposes, we'll use the sentence as the answer
    return sentence;
  }

  /**
   * Calculates a mock readability score for text
   */
  private calculateReadabilityScore(text: string): number {
    // Simple mock readability calculation
    const wordCount = text.split(" ").length;
    const avgWordLength = text.length / wordCount;

    // Score between 0.5 and 1.0 based on average word length
    return Math.min(1.0, Math.max(0.5, 0.7 + (5 - avgWordLength) / 10));
  }

  /**
   * Calculates default card count based on text length
   */
  private calculateDefaultCardCount(text: string): number {
    // Generate roughly 1 card per 100 words, but at least 3 and at most 20
    const wordCount = text.split(" ").length;
    return Math.min(20, Math.max(3, Math.floor(wordCount / 100)));
  }

  /**
   * Creates a simple hash of the input text (for demo purposes)
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Generates a UUID (for demo purposes)
   */
  private generateUUID(): string {
    // Simple UUID generation (not RFC4122 compliant)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
