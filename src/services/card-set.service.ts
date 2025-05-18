import { BaseService } from "./base.service";
import type {
  CardSetDTO,
  CardSetCreateCommand,
  CardSetUpdateCommand,
  CardSetWithCardCount,
  CardSetWithCardsDTO,
  CardListResponse,
  CardToSetAddCommand,
  CardToSetAddResponse,
  CardSetListResponse,
} from "../types";

/**
 * Service for managing card sets
 * Provides methods for CRUD operations on card sets and managing cards within sets
 */
export class CardSetService extends BaseService {
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
      console.info(`[DEBUG] listCardSets - Getting count for user_id: ${userId}`);
      const { count, error: countError } = await this.supabase
        .from("card_sets")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (countError) {
        console.error("Supabase count error:", countError);
        throw countError; // Preserve original error for better debugging
      }

      console.info("Total card sets count:", count);
      const total = count || 0;

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

      // Get card sets with card counts - simplified query for debugging
      console.info(`[DEBUG] listCardSets - Getting card sets for user_id: ${userId}`);
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
        console.error("Supabase error in listCardSets:", error);
        throw error; // Preserve original error for better debugging
      }

      // Transform the response to include card_count
      const transformedData: CardSetWithCardCount[] = cardSets.map((set) => {
        // When using cards:cards_to_sets(count), Supabase returns an array with count objects
        // Extract the count value properly based on its structure
        let cardCount = 0;

        if (Array.isArray(set.cards) && set.cards.length > 0) {
          // Handle the count value from the Supabase response
          cardCount = set.cards[0]?.count || set.cards.length;
        } else if (typeof set.cards === "number") {
          // If it's directly a number
          cardCount = set.cards;
        }

        return {
          id: set.id,
          name: set.name,
          description: set.description,
          created_at: set.created_at,
          updated_at: set.updated_at,
          card_count: cardCount,
        };
      });

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
      // Try a simple count query first to verify basic connectivity and permissions
      console.info(`[DEBUG] createCardSet - Testing connection with simple count for user_id: ${userId}`);
      try {
        const { count, error: countError } = await this.supabase.from("card_sets").select("*", { count: "exact" });

        if (countError) {
          console.error("Supabase error in test count:", countError);
        } else {
          console.info("Test count result:", count);
        }
      } catch (testError) {
        console.error("Error in test count query:", testError);
      }

      // Proceed with the actual create operation
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
        console.error("Supabase error in createCardSet:", error);
        throw error; // Preserve original error for better debugging
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
        console.error("Supabase error in getCardSet:", setError);
        throw setError || new Error("Card set not found");
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count of cards in this set
      console.info(`[DEBUG] getCardSet - Getting card count for set_id: ${setId}`);
      // First, just count the junction table entries without filters on the cards table
      const { count, error: countError } = await this.supabase
        .from("cards_to_sets")
        .select("*", { count: "exact" })
        .eq("set_id", setId);

      if (countError) {
        console.error("Supabase count error in getCardSet:", countError);
        throw countError; // Throw the original error
      }

      console.info(`[DEBUG] getCardSet - Found ${count} cards in set`);

      const total = count || 0;

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
      console.info(`[DEBUG] getCardSet - Fetching cards for set_id: ${setId}`);
      // Join with cards table to get card details
      const { data: cardData, error: cardsError } = await this.supabase
        .from("cards_to_sets")
        .select(
          `
          card_id,
          cards:cards!inner(
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
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("Supabase cards error in getCardSet:", cardsError);
        throw cardsError; // Throw the original error
      }

      console.info(`[DEBUG] getCardSet - Fetched ${cardData?.length || 0} card_to_sets entries`);

      // Transform the response to flatten the card data
      // Filter out any null cards (if there are any)
      const transformedCards = cardData.map((item) => item.cards).filter((card) => card !== null);

      console.info(`[DEBUG] getCardSet - Extracted ${transformedCards.length} valid cards`);

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
        console.error("Supabase error in updateCardSet:", checkError);
        throw checkError || new Error("Card set not found");
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
        console.error("Supabase error updating card set:", error);
        throw error; // Preserve original error
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
        console.error("Supabase error checking card set existence:", checkError);
        throw checkError || new Error("Card set not found");
      }

      const { error } = await this.supabase
        .from("card_sets")
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        })
        .eq("id", setId)
        .eq("user_id", userId); // Make sure to include user_id filter to match RLS policy

      if (error) {
        console.error("Supabase error deleting card set:", error);
        throw error; // Preserve original error
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
        console.error("Supabase error checking card set in addCardsToSet:", setError);
        throw setError || new Error("Card set not found");
      }

      // Check if all cards exist and belong to user
      const { data: cards, error: cardsError } = await this.supabase
        .from("cards")
        .select()
        .in("id", command.card_ids)
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (cardsError || !cards || cards.length !== command.card_ids.length) {
        console.error("Supabase error checking cards in addCardsToSet:", cardsError);
        if (cardsError) throw cardsError;
        throw new Error(
          `One or more cards not found. Found ${cards?.length || 0} of ${command.card_ids.length} requested cards.`
        );
      }

      // Add cards to set, ignore duplicates
      const { error: insertError } = await this.supabase.from("cards_to_sets").upsert(
        command.card_ids.map((cardId: string) => ({
          set_id: setId,
          card_id: cardId,
        })),
        { onConflict: "set_id,card_id" }
      );

      if (insertError) {
        console.error("Supabase error inserting cards to set:", insertError);
        throw insertError; // Preserve original error
      }

      return {
        message: `Successfully added ${command.card_ids.length} cards to set`,
        set_id: setId,
        added_card_ids: command.card_ids,
        added_count: command.card_ids.length,
      };
    }, "Failed to add cards to set");
  }

  /**
   * Get cards that are not in a specific card set
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set
   * @param page Page number for pagination
   * @param limit Number of items per page
   * @returns Paginated list of available cards
   */
  async getAvailableCards(userId: string, setId: string, page: number, limit: number): Promise<CardListResponse> {
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
        console.error("Supabase error checking card set in getAvailableCards:", setError);
        throw setError || new Error("Card set not found");
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get cards already in the set
      const cardsInSetResult = await this.supabase.from("cards_to_sets").select("card_id").eq("set_id", setId);

      // Extract card IDs from the result
      const cardIdsInSet = (cardsInSetResult.data || []).map((r) => r.card_id);

      // If no cards are in the set yet, we can return all cards
      let countQuery = this.supabase
        .from("cards")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      // Only apply the not-in filter if there are cards in the set
      if (cardIdsInSet.length > 0) {
        countQuery = countQuery.not("id", "in", `(${cardIdsInSet.map((id) => `"${id}"`).join(",")})`);
      }

      // Get total count of available cards
      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("Supabase count error in getAvailableCards:", countError);
        throw countError; // Throw the original error
      }

      const total = count || 0;

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

      // Get paginated available cards
      let cardsQuery = this.supabase.from("cards").select().eq("user_id", userId).eq("is_deleted", false);

      // Only apply the not-in filter if there are cards in the set
      if (cardIdsInSet.length > 0) {
        cardsQuery = cardsQuery.not("id", "in", `(${cardIdsInSet.map((id) => `"${id}"`).join(",")})`);
      }

      const { data: cards, error: cardsError } = await cardsQuery
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (cardsError) {
        console.error("Supabase error fetching available cards:", cardsError);
        throw cardsError; // Throw the original error
      }

      return {
        data: cards,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }, "Failed to get available cards");
  }

  /**
   * Test method to diagnose RLS policy issues
   * @param userId The ID of the requesting user
   * @returns True if basic queries work, false otherwise
   */
  async testPermissions(userId: string): Promise<boolean> {
    try {
      console.info(`[DIAGNOSTIC] Testing card_sets table permissions for user: ${userId}`);

      // Test 1: Simple count without user filtering
      const { count: totalCount, error: countError } = await this.supabase
        .from("card_sets")
        .select("*", { count: "exact" });

      console.info(
        "Test 1 - Total count result:",
        totalCount,
        countError ? `Error: ${JSON.stringify(countError)}` : "No error"
      );

      // Test 2: Select with user_id filter
      const { data: userSets, error: userError } = await this.supabase
        .from("card_sets")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      console.info(
        "Test 2 - User filter result:",
        userSets?.length || 0,
        userError ? `Error: ${JSON.stringify(userError)}` : "No error"
      );

      // Test 3: Try a simpler relationship query
      const { data: testJoin, error: joinError } = await this.supabase
        .from("card_sets")
        .select(
          `
          id,
          name,
          cards_to_sets(count)
        `
        )
        .eq("user_id", userId)
        .limit(1);

      console.info(
        "Test 3 - Join test result:",
        testJoin?.length || 0,
        joinError ? `Error: ${JSON.stringify(joinError)}` : "No error"
      );

      return !countError && !userError && !joinError;
    } catch (error) {
      console.error("Permission test failed with error:", error);
      return false;
    }
  }

  /**
   * Remove a card from a set
   * @param userId The ID of the requesting user
   * @param setId The ID of the card set
   * @param cardId The ID of the card to remove from the set
   */
  async removeCardFromSet(userId: string, setId: string, cardId: string): Promise<void> {
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
        console.error("Supabase error checking card set existence:", setError);
        throw setError || new Error("Card set not found");
      }

      // Check if card exists and belongs to user
      const { data: existingCard, error: cardError } = await this.supabase
        .from("cards")
        .select()
        .eq("id", cardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (cardError || !existingCard) {
        console.error("Supabase error checking card existence:", cardError);
        throw cardError || new Error("Card not found");
      }

      // Check if the relationship exists
      const { data: existingRelation, error: relationError } = await this.supabase
        .from("cards_to_sets")
        .select()
        .eq("set_id", setId)
        .eq("card_id", cardId)
        .single();

      if (relationError || !existingRelation) {
        console.error("Supabase error checking card-set relationship:", relationError);
        throw relationError || new Error("Card is not in this set");
      }

      // Delete the junction table record to remove the relationship
      const { error } = await this.supabase.from("cards_to_sets").delete().eq("set_id", setId).eq("card_id", cardId);

      if (error) {
        console.error("Supabase error removing card from set:", error);
        throw error; // Preserve original error
      }
    }, "Failed to remove card from set");
  }
}
