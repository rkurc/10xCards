import { BaseService } from "./base.service";
import type { CardDTO, CardCreateCommand, CardUpdateCommand } from "../types";

/**
 * Service for managing flashcards
 * Provides methods for CRUD operations on individual cards
 */
export class CardService extends BaseService {
  /**
   * Get a card by ID
   * @param userId The ID of the requesting user
   * @param cardId The ID of the card to retrieve
   * @returns The card data
   */
  async getCard(userId: string, cardId: string): Promise<CardDTO> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from("cards")
        .select()
        .eq("id", cardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (error || !data) {
        console.error("Supabase error retrieving card:", error);
        throw error || new Error("Card not found");
      }

      return data;
    }, "Failed to retrieve card");
  }

  /**
   * Create a new card
   * @param userId The ID of the requesting user
   * @param command The command containing card data
   * @returns The created card
   */
  async createCard(userId: string, command: CardCreateCommand): Promise<CardDTO> {
    return this.executeDbOperation(async () => {
      // Prepare the card data
      const cardData = {
        user_id: userId,
        front_content: command.front_content,
        back_content: command.back_content,
        source_type: command.source_type || "MANUAL",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      };

      // Insert the card
      const { data, error } = await this.supabase.from("cards").insert(cardData).select().single();

      if (error || !data) {
        console.error("Supabase error creating card:", error);
        throw error || new Error("Failed to create card");
      }

      return data;
    }, "Failed to create card");
  }

  /**
   * Update a card's content
   * @param userId The ID of the requesting user
   * @param cardId The ID of the card to update
   * @param command The command containing updated card data
   * @returns The updated card
   */
  async updateCard(userId: string, cardId: string, command: CardUpdateCommand): Promise<CardDTO> {
    return this.executeDbOperation(async () => {
      // First check if the card exists and belongs to the user
      const { data: existingCard, error: checkError } = await this.supabase
        .from("cards")
        .select()
        .eq("id", cardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (checkError || !existingCard) {
        console.error("Supabase error checking card existence:", checkError);
        throw checkError || new Error("Card not found");
      }

      // Prepare update data
      const updateData = {
        front_content: command.front_content,
        back_content: command.back_content,
        updated_at: new Date().toISOString(),
      };

      // Update the card
      const { data, error } = await this.supabase
        .from("cards")
        .update(updateData)
        .eq("id", cardId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !data) {
        console.error("Supabase error updating card:", error);
        throw error || new Error("Failed to update card");
      }

      return data;
    }, "Failed to update card");
  }

  /**
   * Soft-delete a card
   * @param userId The ID of the requesting user
   * @param cardId The ID of the card to delete
   */
  async deleteCard(userId: string, cardId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      // First check if the card exists and belongs to the user
      const { data: existingCard, error: checkError } = await this.supabase
        .from("cards")
        .select()
        .eq("id", cardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (checkError || !existingCard) {
        console.error("Supabase error checking card existence:", checkError);
        throw checkError || new Error("Card not found");
      }
      // Soft-delete the card
      const { error } = await this.supabase
        .from("cards")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", cardId)
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase error soft-deleting card:", error);
        throw error; // Preserve original error
      }
    }, "Failed to delete card");
  }
}
