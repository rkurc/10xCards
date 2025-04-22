export interface GenerationStartCommand {
  text: string;
  target_count: number;
}

export interface GenerationResponse {
  generation_id: string;
}
