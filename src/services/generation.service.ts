import { supabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";

import type {
  GenerationCardDTO,
  GenerationStartCommand,
  GenerationStartResponse,
  CardDTO,
  GenerationAcceptAllCommand,
  GenerationAcceptAllResponse,
  GenerationCardAcceptCommand,
  GenerationResultResponse,
  GenerationStatusResponse,
  GenerationFinalizeCommand,
  GenerationFinalizeResponse
} from "../types";

export class GenerationService {
  constructor(private supabase: typeof supabaseClient | supabaseClient<Database>) {}

  /**
   * Starts a flashcard generation process from the provided text
   * @param userId The ID of the requesting user
   * @param command The generation command containing text and options
   * @returns The generation ID and estimated processing time
   */
  async startTextProcessing(userId: string, command: GenerationStartCommand): Promise<GenerationStartResponse> {
    // Mock implementation for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    const generationId = 'mock-gen-' + Date.now();
    
    return {
      generation_id: generationId,
      estimated_time_seconds: 5
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

  /**
   * Gets the results of a generation job
   * @param userId The ID of the requesting user
   * @param generationId The ID of the generation job
   * @returns The generation results including cards and stats
   */
  async getGenerationResults(userId: string, generationId: string): Promise<GenerationResultResponse> {
    // Sprawdzenie czy proces generacji istnieje i należy do użytkownika
    const { data: generationJob, error: jobError } = await this.supabase
      .from("generation_logs")
      .select("id, created_at, generated_count, source_text_length")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (jobError || !generationJob) {
      throw { code: "NOT_FOUND", message: "Proces generacji nie został znaleziony" };
    }

    // Pobieranie wygenerowanych propozycji fiszek
    const { data: cards, error: cardsError } = await this.supabase
      .from("generation_results") // Zakładamy, że taka tabela istnieje
      .select("id, front_content, back_content, readability_score")
      .eq("generation_id", generationId);

    if (cardsError) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas pobierania wyników generacji" };
    }

    // Przekształcenie danych do odpowiedniego formatu
    const cardDTOs: GenerationCardDTO[] = cards.map(card => ({
      id: card.id,
      front_content: card.front_content,
      back_content: card.back_content,
      readability_score: card.readability_score
    }));

    return {
      cards: cardDTOs,
      stats: {
        text_length: generationJob.source_text_length || 0,
        generated_count: generationJob.generated_count || cardDTOs.length,
        generation_time_ms: 0 // W rzeczywistości pobieralibyśmy czas generacji
      }
    };
  }

  /**
   * Accepts all generated flashcards from a generation job
   * @param userId The ID of the requesting user
   * @param generationId The ID of the generation job
   * @param command The accept command containing optional set ID
   * @returns The count and IDs of accepted cards
   */
  async acceptAllCards(
    userId: string,
    generationId: string,
    command: GenerationAcceptAllCommand
  ): Promise<GenerationAcceptAllResponse> {
    // Get generation log to check ownership
    const { data: generationLog, error: logError } = await this.supabase
      .from("generation_logs")
      .select("*")
      .eq("id", generationId)
      .single();

    if (logError || !generationLog) {
      throw new Error("Generation not found");
    }

    if (generationLog.user_id !== userId) {
      throw new Error("Access denied");
    }

    // If set_id provided, verify set exists and belongs to user
    if (command.set_id) {
      const { data: cardSet, error: setError } = await this.supabase
        .from("card_sets")
        .select("id")
        .eq("id", command.set_id)
        .eq("user_id", userId)
        .single();

      if (setError || !cardSet) {
        throw new Error("Card set not found");
      }
    }

    // Get all generated cards
    const { data: generatedCards, error: cardsError } = await this.supabase
      .from("generation_results")
      .select("*")
      .eq("generation_id", generationId);

    if (cardsError) {
      throw new Error("Failed to fetch generated cards");
    }

    // Begin a transaction to create cards and update statistics
    const { data: cards, error: insertError } = await this.supabase
      .from("cards")
      .insert(
        generatedCards.map((card: { front_content: any; back_content: any; readability_score: any }) => ({
          user_id: userId,
          front_content: card.front_content,
          back_content: card.back_content,
          source_type: "ai",
          readability_score: card.readability_score,
        }))
      )
      .select("id");

    if (insertError) {
      throw new Error("Failed to create cards");
    }

    // If set_id provided, link cards to set
    if (command.set_id && cards) {
      const { error: linkError } = await this.supabase.from("cards_to_sets").insert(
        cards.map((card: { id: any }) => ({
          card_id: card.id,
          set_id: command.set_id,
        }))
      );

      if (linkError) {
        throw new Error("Failed to link cards to set");
      }
    }

    // Update generation statistics
    await this.supabase
      .from("generation_logs")
      .update({
        accepted_unedited_count: generatedCards.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    return {
      accepted_count: cards?.length || 0,
      card_ids: cards?.map((c: { id: any }) => c.id) || [],
    };
  }

  /**
   * Accepts a specific generated flashcard, optionally with edits
   * @param userId The ID of the requesting user
   * @param generationId The ID of the generation job
   * @param cardId The ID of the card to accept
   * @param command The accept command containing optional edits and set ID
   * @returns The created card
   */
  async acceptCard(
    userId: string,
    generationId: string,
    cardId: string,
    command: GenerationCardAcceptCommand
  ): Promise<CardDTO> {
    // Get generation log to check ownership
    const { data: generationLog, error: logError } = await this.supabase
      .from("generation_logs")
      .select("*")
      .eq("id", generationId)
      .single();

    if (logError || !generationLog) {
      throw new Error("Generation not found");
    }

    if (generationLog.user_id !== userId) {
      throw new Error("Access denied");
    }

    // If set_id provided, verify set exists and belongs to user
    if (command.set_id) {
      const { data: cardSet, error: setError } = await this.supabase
        .from("card_sets")
        .select("id")
        .eq("id", command.set_id)
        .eq("user_id", userId)
        .single();

      if (setError || !cardSet) {
        throw new Error("Card set not found");
      }
    }

    // Get the generated card
    const { data: generatedCard, error: cardError } = await this.supabase
      .from("generation_results")
      .select("*")
      .eq("generation_id", generationId)
      .eq("id", cardId)
      .single();

    if (cardError || !generatedCard) {
      throw new Error("Generated card not found");
    }

    // Create the card with optional edited content
    const { data: card, error: insertError } = await this.supabase
      .from("cards")
      .insert({
        user_id: userId,
        front_content: command.front_content || generatedCard.front_content,
        back_content: command.back_content || generatedCard.back_content,
        source_type: command.front_content || command.back_content ? "ai_edited" : "ai",
        readability_score: generatedCard.readability_score,
      })
      .select()
      .single();

    if (insertError || !card) {
      throw new Error("Failed to create card");
    }

    // If set_id provided, link card to set
    if (command.set_id) {
      const { error: linkError } = await this.supabase
        .from("cards_to_sets")
        .insert({ card_id: card.id, set_id: command.set_id });

      if (linkError) {
        throw new Error("Failed to link card to set");
      }
    }

    // Update generation statistics
    await this.supabase
      .from("generation_logs")
      .update({
        [command.front_content || command.back_content ? "accepted_edited_count" : "accepted_unedited_count"]:
          generationLog[
            command.front_content || command.back_content ? "accepted_edited_count" : "accepted_unedited_count"
          ] + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    return card;
  }

  /**
   * Rejects a specific generated flashcard
   * @param userId The ID of the requesting user
   * @param generationId The ID of the generation job
   * @param cardId The ID of the card to reject
   */
  async rejectCard(userId: string, generationId: string, cardId: string): Promise<void> {
    // Get generation log to check ownership
    const { data: generationLog, error: logError } = await this.supabase
      .from("generation_logs")
      .select("*")
      .eq("id", generationId)
      .single();

    if (logError || !generationLog) {
      throw new Error("Generation not found");
    }

    if (generationLog.user_id !== userId) {
      throw new Error("Access denied");
    }

    // Get the generated card - use match instead of chaining eq
    const { data: generatedCard, error: cardError } = await this.supabase
      .from("generation_results")
      .select("id")
      .match({ generation_id: generationId, id: cardId })
      .single();

    if (cardError || !generatedCard) {
      throw new Error("Generated card not found");
    }

    // Mark the card as rejected by deleting it from generation_results
    const { error: deleteError } = await this.supabase.from("generation_results").delete().eq("id", cardId);

    if (deleteError) {
      throw new Error("Failed to reject card");
    }

    // Update rejection statistics in generation_logs
    await this.supabase
      .from("generation_logs")
      .update({
        rejected_count: (generationLog.rejected_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);
  }

  /**
   * Pobiera status procesu generacji fiszek
   * @param userId ID użytkownika
   * @param generationId ID procesu generacji
   * @returns Status procesu generacji
   */
  async getGenerationStatus(userId: string, generationId: string): Promise<GenerationStatusResponse | null> {
    // Sprawdzenie czy proces generacji istnieje i należy do użytkownika
    const { data: generationJob, error } = await this.supabase
      .from("generation_logs")
      .select("id, created_at, generated_count")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error || !generationJob) {
      return null;
    }

    // Status generacji zależy od stanu danych w bazie
    // Tutaj dodałbym rzeczywistą logikę sprawdzania statusu, np. czy istnieją już wyniki
    // W przykładzie zakładamy, że jeśli proces istnieje, to jest już ukończony
    
    return {
      status: "completed", // W rzeczywistości status byłby dynamiczny
      progress: 100        // W rzeczywistości postęp byłby dynamiczny
    };
  }

  /**
   * Finalizuje proces generacji tworząc nowy zestaw fiszek
   * @param userId ID użytkownika
   * @param generationId ID procesu generacji
   * @param command Dane do utworzenia zestawu
   * @returns Informacje o utworzonym zestawie
   */
  async finalizeGeneration(
    userId: string, 
    generationId: string, 
    command: GenerationFinalizeCommand
  ): Promise<GenerationFinalizeResponse> {
    // Sprawdzenie czy proces generacji istnieje i należy do użytkownika
    const { data: generationJob, error: jobError } = await this.supabase
      .from("generation_logs")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (jobError || !generationJob) {
      throw { code: "NOT_FOUND", message: "Proces generacji nie został znaleziony" };
    }

    // Sprawdzenie czy wszystkie karty należą do tego procesu generacji
    const { data: cards, error: cardsError } = await this.supabase
      .from("generation_results")
      .select("id")
      .eq("generation_id", generationId)
      .in("id", command.accepted_cards);

    if (cardsError) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas weryfikacji wybranych fiszek" };
    }

    if (cards.length !== command.accepted_cards.length) {
      throw { code: "INVALID_CARDS", message: "Niektóre wybrane fiszki nie należą do tego procesu generacji" };
    }

    // Rozpoczęcie transakcji
    // W rzeczywistej implementacji użylibyśmy transakcji dla zapewnienia atomowości operacji
    
    // 1. Utworzenie nowego zestawu
    const { data: newSet, error: setError } = await this.supabase
      .from("card_sets")
      .insert({
        name: command.name,
        description: command.description || "",
        user_id: userId
      })
      .select("id")
      .single();

    if (setError || !newSet) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas tworzenia nowego zestawu" };
    }

    // 2. Pobranie pełnych danych wybranych fiszek
    const { data: selectedCards, error: selectedCardsError } = await this.supabase
      .from("generation_results")
      .select("id, front_content, back_content, readability_score")
      .in("id", command.accepted_cards);

    if (selectedCardsError || !selectedCards) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas pobierania wybranych fiszek" };
    }

    // 3. Utworzenie nowych fiszek na podstawie zaakceptowanych propozycji
    const cardsToInsert = selectedCards.map(card => ({
      front_content: card.front_content,
      back_content: card.back_content,
      source_type: "ai", // Zakładamy, że to są fiszki z AI bez edycji
      readability_score: card.readability_score,
      user_id: userId
    }));

    const { data: insertedCards, error: insertCardsError } = await this.supabase
      .from("cards")
      .insert(cardsToInsert)
      .select("id");

    if (insertCardsError || !insertedCards) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas tworzenia fiszek" };
    }

    // 4. Dodanie fiszek do nowo utworzonego zestawu
    const cardsToSetsRecords = insertedCards.map(card => ({
      card_id: card.id,
      set_id: newSet.id
    }));

    const { error: linkError } = await this.supabase
      .from("cards_to_sets")
      .insert(cardsToSetsRecords);

    if (linkError) {
      throw { code: "DATABASE_ERROR", message: "Błąd podczas dodawania fiszek do zestawu" };
    }

    // 5. Aktualizacja statystyk generacji
    const { error: statsError } = await this.supabase
      .from("generation_logs")
      .update({
        accepted_unedited_count: command.accepted_cards.length
      })
      .eq("id", generationId);

    if (statsError) {
      console.error("Błąd podczas aktualizacji statystyk generacji:", statsError);
      // Nie przerywamy procesu z powodu błędu aktualizacji statystyk
    }

    // Zwrócenie informacji o utworzonym zestawie
    return {
      set_id: newSet.id,
      name: command.name,
      card_count: insertedCards.length
    };
  }
}
