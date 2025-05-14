export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      card_personalizations: {
        Row: {
          card_id: string;
          created_at: string | null;
          id: string;
          settings: Json | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          card_id: string;
          created_at?: string | null;
          id?: string;
          settings?: Json | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          card_id?: string;
          created_at?: string | null;
          id?: string;
          settings?: Json | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_personalizations_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_personalizations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      card_progress: {
        Row: {
          card_id: string;
          created_at: string | null;
          ease_factor: number | null;
          id: string;
          interval: number | null;
          last_review: string | null;
          next_review: string | null;
          review_count: number | null;
          status: Database["public"]["Enums"]["knowledge_status"] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          card_id: string;
          created_at?: string | null;
          ease_factor?: number | null;
          id?: string;
          interval?: number | null;
          last_review?: string | null;
          next_review?: string | null;
          review_count?: number | null;
          status?: Database["public"]["Enums"]["knowledge_status"] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          card_id?: string;
          created_at?: string | null;
          ease_factor?: number | null;
          id?: string;
          interval?: number | null;
          last_review?: string | null;
          next_review?: string | null;
          review_count?: number | null;
          status?: Database["public"]["Enums"]["knowledge_status"] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_progress_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "card_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      card_sets: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_deleted: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_sets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          back_content: string;
          created_at: string | null;
          deleted_at: string | null;
          front_content: string;
          id: string;
          is_deleted: boolean | null;
          readability_score: number | null;
          source_type: Database["public"]["Enums"]["source_type"];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          back_content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          front_content: string;
          id?: string;
          is_deleted?: boolean | null;
          readability_score?: number | null;
          source_type?: Database["public"]["Enums"]["source_type"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          back_content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          front_content?: string;
          id?: string;
          is_deleted?: boolean | null;
          readability_score?: number | null;
          source_type?: Database["public"]["Enums"]["source_type"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cards_to_sets: {
        Row: {
          card_id: string;
          created_at: string | null;
          set_id: string;
        };
        Insert: {
          card_id: string;
          created_at?: string | null;
          set_id: string;
        };
        Update: {
          card_id?: string;
          created_at?: string | null;
          set_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_to_sets_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_to_sets_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "card_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      generation_logs: {
        Row: {
          accepted_edited_count: number;
          accepted_unedited_count: number;
          created_at: string | null;
          generated_count: number;
          id: number;
          model: string | null;
          source_text_hash: string | null;
          source_text_length: number | null;
          user_id: string;
        };
        Insert: {
          accepted_edited_count?: number;
          accepted_unedited_count?: number;
          created_at?: string | null;
          generated_count?: number;
          id?: number;
          model?: string | null;
          source_text_hash?: string | null;
          source_text_length?: number | null;
          user_id: string;
        };
        Update: {
          accepted_edited_count?: number;
          accepted_unedited_count?: number;
          created_at?: string | null;
          generated_count?: number;
          id?: number;
          model?: string | null;
          source_text_hash?: string | null;
          source_text_length?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generation_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          is_deleted: boolean | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id: string;
          is_deleted?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      knowledge_status: "new" | "learning" | "review" | "mastered";
      source_type: "ai" | "ai_edited" | "manual";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      knowledge_status: ["new", "learning", "review", "mastered"],
      source_type: ["ai", "ai_edited", "manual"],
    },
  },
} as const;
