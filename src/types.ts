import { Database } from './db/database.types';

// ===== Common Types =====

/**
 * Common pagination information structure used across multiple endpoints
 */
export type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

// ===== Card Related Types =====

/**
 * Represents a card as returned by the API
 */
export type CardDTO = Pick<
  Database['public']['Tables']['cards']['Row'],
  'id' | 'front_content' | 'back_content' | 'source_type' | 'readability_score' | 'created_at' | 'updated_at'
>;

/**
 * Command to create a new card
 */
export type CardCreateCommand = Pick<
  Database['public']['Tables']['cards']['Insert'],
  'front_content' | 'back_content' | 'source_type'
> & {
  set_id?: string; // Optional set to add the card to
};

/**
 * Command to update an existing card
 */
export type CardUpdateCommand = Pick<
  Database['public']['Tables']['cards']['Update'],
  'front_content' | 'back_content'
>;

/**
 * Paginated response for card list endpoints
 */
export type CardListResponse = {
  data: CardDTO[];
  pagination: PaginationInfo;
};

// ===== Card Set Related Types =====

/**
 * Represents a card set as returned by the API
 */
export type CardSetDTO = Pick<
  Database['public']['Tables']['card_sets']['Row'],
  'id' | 'name' | 'description' | 'created_at' | 'updated_at'
>;

/**
 * Card set with additional count of cards
 */
export type CardSetWithCardCount = CardSetDTO & {
  card_count: number;
};

/**
 * Command to create a new card set
 */
export type CardSetCreateCommand = Pick<
  Database['public']['Tables']['card_sets']['Insert'],
  'name' | 'description'
>;

/**
 * Command to update an existing card set
 */
export type CardSetUpdateCommand = CardSetCreateCommand;

/**
 * Paginated response for card set list endpoints
 */
export type CardSetListResponse = {
  data: CardSetWithCardCount[];
  pagination: PaginationInfo;
};

/**
 * Represents a card set with its associated cards
 */
export type CardSetWithCardsDTO = CardSetDTO & {
  cards: {
    data: CardDTO[];
    pagination: PaginationInfo;
  };
};

/**
 * Command to add cards to a set
 */
export type CardToSetAddCommand = {
  card_ids: string[];
};

/**
 * Response after adding cards to a set
 */
export type CardToSetAddResponse = {
  added_count: number;
};

// ===== AI Flashcard Generation Types =====

/**
 * Command to start generation of flashcards from text
 */
export type GenerationStartCommand = {
  text: string;
  target_count?: number;
  set_id?: string;
};

/**
 * Response after starting a generation process
 */
export type GenerationStartResponse = {
  generation_id: string;
  estimated_time_seconds: number;
};

/**
 * Possible statuses for a generation job
 */
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Response with the current status of a generation job
 */
export type GenerationStatusResponse = {
  status: GenerationStatus;
  progress: number;
  error?: string;
};

/**
 * Represents a generated card proposal before acceptance
 */
export type GenerationCardDTO = {
  id: string;
  front_content: string;
  back_content: string;
  readability_score: number | null;
};

/**
 * Response containing generated flashcard proposals
 */
export type GenerationResultResponse = {
  cards: GenerationCardDTO[];
  stats: {
    text_length: number;
    generated_count: number;
    generation_time_ms: number;
  };
};

/**
 * Command to accept all generated flashcards
 */
export type GenerationAcceptAllCommand = {
  set_id?: string;
};

/**
 * Response after accepting all generated flashcards
 */
export type GenerationAcceptAllResponse = {
  accepted_count: number;
  card_ids: string[];
};

/**
 * Command to accept a specific generated flashcard with optional edits
 */
export type GenerationCardAcceptCommand = {
  set_id?: string;
  front_content?: string;
  back_content?: string;
};

// ===== Statistics Types =====

/**
 * Entry in generation history chart data
 */
export type GenerationHistoryEntry = {
  date: string;
  generated: number;
  accepted: number;
};

/**
 * Response with statistics about flashcard generation
 */
export type GenerationStatisticsResponse = {
  total_generated: number;
  accepted_unedited: number;
  accepted_edited: number;
  rejected: number;
  acceptance_rate: number;
  average_generation_time: number;
  history: GenerationHistoryEntry[];
};

// ===== Card Personalization Types =====

/**
 * Settings for card personalization
 */
export type CardPersonalizationSettings = {
  color?: string;
  font_size?: string;
  references?: string[];
  tags?: string[];
  custom_fields?: Record<string, any>;
};

/**
 * Represents card personalization data as returned by API
 */
export type CardPersonalizationDTO = {
  id: string;
  card_id: string;
  settings: CardPersonalizationSettings;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Command to update card personalization settings
 */
export type CardPersonalizationUpdateCommand = {
  settings: CardPersonalizationSettings;
};
