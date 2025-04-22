import { toast } from 'sonner';
import { GenerationCardDTO, GenerationStartCommand, GenerationStartResponse, type CardDTO, type GenerationAcceptAllCommand, type GenerationAcceptAllResponse, type GenerationCardAcceptCommand } from "../types";

// Define missing response type that's needed for the mock
export type GenerationResultResponse = {
  cards: GenerationCardDTO[];
  stats: {
    text_length: number;
    generated_count: number;
    generation_time_ms: number;
  };
};

// Mock implementation of the generation service for testing
export class GenerationMockService {
  // Simulate network delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start generation process
  async startGeneration(command: GenerationStartCommand): Promise<GenerationStartResponse> {
    try {
      // Simulating API call
      await this.delay(800);

      // Mock successful response
      return {
        generation_id: 'gen_' + Date.now(),
        estimated_time_seconds: 5
      };
    } catch (error) {
      console.error('Error starting generation:', error);
      toast.error('Failed to start generation process');
      throw error;
    }
  }

  // Get generation results
  async getGenerationResults(generationId: string): Promise<GenerationResultResponse> {
    try {
      // Simulating API call
      await this.delay(1000);

      // Mock successful response
      return {
        cards: [
          {
            id: "card1",
            front_content: "Co to jest React?",
            back_content: "Biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Facebooka.",
            readability_score: 85.4
          },
          {
            id: "card2",
            front_content: "Czym jest JSX?",
            back_content: "Rozszerzenie składni JavaScript, które pozwala pisać kod HTML w JavaScript.",
            readability_score: 78.2
          },
          {
            id: "card3",
            front_content: "Co to są hooki w React?",
            back_content: "Funkcje, które pozwalają na używanie stanu i innych funkcji React w komponentach funkcyjnych.",
            readability_score: 82.7
          }
        ],
        stats: {
          text_length: 1250,
          generated_count: 3,
          generation_time_ms: 1500
        }
      };
    } catch (error) {
      console.error('Error fetching generation results:', error);
      toast.error('Failed to load generation results');
      throw error;
    }
  }

  // Accept all cards
  async acceptAll(generationId: string, command: GenerationAcceptAllCommand): Promise<GenerationAcceptAllResponse> {
    try {
      // Simulating API call
      await this.delay(1200);

      // Mock successful response
      return {
        accepted_count: 3,
        card_ids: ["card1", "card2", "card3"]
      };
    } catch (error) {
      console.error('Error accepting all cards:', error);
      toast.error('Failed to accept all cards');
      throw error;
    }
  }

  // Accept specific card
  async acceptCard(generationId: string, cardId: string, command: GenerationCardAcceptCommand): Promise<CardDTO> {
    try {
      // Simulating API call
      await this.delay(500);

      // Mock successful response
      return {
        id: cardId,
        front_content: command.front_content || "Default front content",
        back_content: command.back_content || "Default back content",
        readability_score: 85.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error accepting card:', error);
      toast.error('Failed to accept card');
      throw error;
    }
  }

  // Reject specific card
  async rejectCard(generationId: string, cardId: string): Promise<void> {
    try {
      // Simulating API call
      await this.delay(500);
      
      // No response data is needed as the API returns 204 No Content
      return;
    } catch (error) {
      console.error('Error rejecting card:', error);
      toast.error('Failed to reject card');
      throw error;
    }
  }
}

// Create singleton instance
export const generationMock = new GenerationMockService();
