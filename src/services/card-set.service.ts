import { BaseService } from "./base.service";
import type { CardSetDTO, CardSetCreateCommand, CardSetUpdateCommand, CardSetWithCardCount, CardSetWithCardsDTO, CardListResponse, CardToSetAddCommand, CardToSetAddResponse, CardSetListResponse } from "../types";
import type { SupabaseClient } from "../db/supabase.client";

/**
 * Service for managing card sets
 * Provides methods for CRUD operations on card sets and managing cards within sets
 */
export class CardSetService extends BaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Get a paginated list of card sets for a user
   * @param userId The ID of the requesting user
   * @param page Page number (1-based)
   * @param limit Number of items per page
   * @returns Paginated list of card sets with card counts
   */
  async listCardSets(userId: string, page: number, limit: number): Promise<CardSetListResponse> {
    return this.executeDbOperation(async () => {
      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count of user's non-deleted card sets
      const { count: total } = await this.supabase
        .from("card_sets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (!total) {
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        };
      }

      // Get card sets with card counts
      const { data: cardSets, error } = await this.supabase
        .from("card_sets")
        .select(
          `
          id,
          name,
          description,
          created_at,
          updated_at,
          cards:cards_to_sets(count)
          `
        )
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Failed to fetch card sets");
      }

      // Transform the response to include card_count
      const transformedData: CardSetWithCardCount[] = cardSets.map((set: any) => ({
        id: set.id,
        name: set.name,
        description: set.description,
        created_at: set.created_at,
        updated_at: set.updated_at,
        card_count: set.cards?.length ?? 0,
      }));

      return {
        data: transformedData,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }, "Failed to list card sets");
  }

  /**
   * Create a new card set
   * @param userId The ID of the requesting user
   * @param command The create command containing set details
   * @returns The created card set
   */
  async createCardSet(userId: string, command: CardSetCreateCommand): Promise<CardSetDTO> {
    return this.executeDbOperation(async () => {
      const { data: cardSet, error } = await this.supabase
        .from("card_sets")
        .insert({
          user_id: userId,
          name: command.name,
          description: command.description,
        })
        .select()
        .single();

      if (error) {
        throw new Error("Failed to create card set");
      }

      return cardSet;
    }, "Failed to create card set");
  }

  /**
   * Get a specific card set with its cards
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set
   * @param page Page number for cards pagination
   * @param limit Number of cards per page
   * @returns The card set with paginated cards
   */
  async getCardSet(userId: string, setId: string, page: number, limit: number): Promise<CardSetWithCardsDTO> {
    return this.executeDbOperation(async () => {
      // Get card set
      const { data: cardSet, error: setError } = await this.supabase
        .from("card_sets")
        .select("*")
        .eq("id", setId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (setError || !cardSet) {
        throw new Error("Card set not found");
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count of cards in this set
      const { count: total } = await this.supabase
        .from("cards_to_sets")
        .select("*", { count: "exact", head: true })
        .eq("set_id", setId)
        .eq("card.is_deleted", false);

      if (!total) {
        return {
          ...cardSet,
          cards: {
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              pages: 0,
            },
          },
        };
      }

      // Get paginated cards for this set
      const { data: cards, error: cardsError } = await this.supabase
        .from("cards_to_sets")
        .select(
          `
          card:cards(
            id,
            front_content,
            back_content,
            source_type,
            readability_score,
            created_at,
            updated_at
          )
        `
        )
        .eq("set_id", setId)
        .eq("card.is_deleted", false)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (cardsError) {
        throw new Error("Failed to fetch cards");
      }

      // Transform the response to flatten the card data
      const transformedCards = cards
        .map((item: any) => item.card)
        .filter((card: any) => card !== null);

      return {
        ...cardSet,
        cards: {
          data: transformedCards,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      };
    }, "Failed to get card set");
  }

  /**
   * Update a card set
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set to update
   * @param command The update command containing new set details
   * @returns The updated card set
   */
  async updateCardSet(userId: string, setId: string, command: CardSetUpdateCommand): Promise<CardSetDTO> {
    return this.executeDbOperation(async () => {
      const { data: existingSet, error: checkError } = await this.supabase
        .from("card_sets")
        .select()
        .eq("id", setId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (checkError || !existingSet) {
        throw new Error("Card set not found");
      }

      const { data: cardSet, error } = await this.supabase
        .from("card_sets")
        .update({
          name: command.name,
          description: command.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", setId)
        .select()
        .single();

      if (error) {
        throw new Error("Failed to update card set");
      }

      return cardSet;
    }, "Failed to update card set");
  }

  /**
   * Soft delete a card set
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set to delete
   */
  async deleteCardSet(userId: string, setId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      const { data: existingSet, error: checkError } = await this.supabase
        .from("card_sets")
        .select()
        .eq("id", setId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (checkError || !existingSet) {
        throw new Error("Card set not found");
      }

      const { error } = await this.supabase
        .from("card_sets")
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", setId);

      if (error) {
        throw new Error("Failed to delete card set");
      }
    }, "Failed to delete card set");
  }

  /**
   * Add cards to a set
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set
   * @param command The command containing card IDs to add
   * @returns The updated card set with cards
   */
  async addCardsToSet(userId: string, setId: string, command: CardToSetAddCommand): Promise<CardToSetAddResponse> {
    return this.executeDbOperation(async () => {
      // Check if set exists and belongs to user
      const { data: existingSet, error: setError } = await this.supabase
        .from("card_sets")
        .select()
        .eq("id", setId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (setError || !existingSet) {
        throw new Error("Card set not found");
      }

      // Check if all cards exist and belong to user
      const { data: cards, error: cardsError } = await this.supabase
        .from("cards")
        .select()
        .in("id", command.card_ids)
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (cardsError || !cards || cards.length !== command.card_ids.length) {
        throw new Error("One or more cards not found");
      }

      // Add cards to set, ignore duplicates
      const { error: insertError } = await this.supabase.from("cards_to_sets").upsert(
        command.card_ids.map((cardId) => ({
          set_id: setId,
          card_id: cardId,
        })),
        { onConflict: "set_id,card_id" }
      );

      if (insertError) {
        throw new Error("Failed to add cards to set");
      }

      return {
        message: `Successfully added ${command.card_ids.length} cards to set`,
        set_id: setId,
        added_card_ids: command.card_ids,
        added_count: command.card_ids.length,
      };
    }, "Failed to add cards to set");
  }
}
