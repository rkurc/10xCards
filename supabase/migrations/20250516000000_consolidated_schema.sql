

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."knowledge_status" AS ENUM (
    'new',
    'learning',
    'review',
    'mastered'
);


ALTER TYPE "public"."knowledge_status" OWNER TO "postgres";


CREATE TYPE "public"."source_type" AS ENUM (
    'ai',
    'ai_edited',
    'manual'
);


ALTER TYPE "public"."source_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text" DEFAULT ''::"text", "p_accepted_cards" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_set_id UUID;
  v_card_ids UUID[];
  v_result JSON;
  v_card_count INTEGER;
BEGIN
  -- Check if generation exists and belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM generation_logs 
    WHERE id = p_generation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Generation not found or access denied';
  END IF;
  
  -- Start atomic transaction
  BEGIN
    -- Create new card set
    INSERT INTO card_sets (
      name, 
      description, 
      user_id,
      created_at,
      updated_at
    )
    VALUES (
      p_name, 
      p_description, 
      p_user_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_set_id;
    
    -- Create cards from selected generation results
    WITH inserted_cards AS (
      INSERT INTO cards (
        front_content, 
        back_content, 
        readability_score,
        source_type,
        user_id,
        created_at,
        updated_at
      )
      SELECT 
        gr.front_content,
        gr.back_content,
        gr.readability_score,
        'ai',
        p_user_id,
        NOW(),
        NOW()
      FROM generation_results gr
      WHERE gr.generation_id = p_generation_id
      AND gr.id = ANY(p_accepted_cards)
      RETURNING id
    )
    SELECT array_agg(id) INTO v_card_ids FROM inserted_cards;
    
    -- Count the number of cards inserted
    SELECT COALESCE(array_length(v_card_ids, 1), 0) INTO v_card_count;
    
    -- Link cards to set
    INSERT INTO cards_to_sets (card_id, set_id, created_at)
    SELECT unnest(v_card_ids), v_set_id, NOW();
    
    -- Update generation statistics
    UPDATE generation_logs
    SET 
      accepted_unedited_count = COALESCE(accepted_unedited_count, 0) + v_card_count,
      updated_at = NOW()
    WHERE id = p_generation_id;
    
    -- Prepare result
    v_result = json_build_object(
      'set_id', v_set_id,
      'name', p_name,
      'card_count', v_card_count
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Re-raise the exception for proper error handling
      RAISE;
  END;
END;
$$;


ALTER FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) IS 'Finalizes the generation process by creating a card set and linking accepted cards';



CREATE OR REPLACE FUNCTION "public"."handle_auth_user_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- If a user is created or updated in auth.users, 
  -- ensure corresponding profile exists in public.profiles
  insert into public.profiles (id, username, created_at, updated_at)
  values (
    new.id, 
    new.email, 
    new.created_at,
    new.updated_at
  )
  on conflict (id) do update set
    -- Only update username if it's null
    username = coalesce(public.profiles.username, new.email),
    updated_at = new.updated_at;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_auth_user_sync"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_auth_user_sync"() IS 'Automatically creates or updates a user profile when an auth.user is created or updated';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."card_personalizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."card_personalizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."card_personalizations" IS 'User-specific card customizations';



CREATE TABLE IF NOT EXISTS "public"."card_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "status" "public"."knowledge_status" DEFAULT 'new'::"public"."knowledge_status",
    "ease_factor" numeric(4,2) DEFAULT 2.5,
    "interval" integer DEFAULT 0,
    "next_review" timestamp with time zone DEFAULT "now"(),
    "last_review" timestamp with time zone,
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."card_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."card_progress" IS 'Tracks learning progress for spaced repetition algorithm';



CREATE TABLE IF NOT EXISTS "public"."card_sets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "card_sets_name_length" CHECK (("char_length"("name") <= 100))
);


ALTER TABLE "public"."card_sets" OWNER TO "postgres";


COMMENT ON TABLE "public"."card_sets" IS 'Sets/groups of flashcards';



CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "front_content" "text" NOT NULL,
    "back_content" "text" NOT NULL,
    "source_type" "public"."source_type" DEFAULT 'manual'::"public"."source_type" NOT NULL,
    "readability_score" numeric(4,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "cards_back_length" CHECK (("char_length"("back_content") <= 500)),
    CONSTRAINT "cards_front_length" CHECK (("char_length"("front_content") <= 200))
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


COMMENT ON TABLE "public"."cards" IS 'Individual flashcards with front and back content';



CREATE TABLE IF NOT EXISTS "public"."cards_to_sets" (
    "card_id" "uuid" NOT NULL,
    "set_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cards_to_sets" OWNER TO "postgres";


COMMENT ON TABLE "public"."cards_to_sets" IS 'Junction table for many-to-many relationship between cards and sets';



CREATE TABLE IF NOT EXISTS "public"."generation_logs" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "model" "text",
    "generated_count" integer DEFAULT 0 NOT NULL,
    "accepted_unedited_count" integer DEFAULT 0 NOT NULL,
    "accepted_edited_count" integer DEFAULT 0 NOT NULL,
    "source_text_hash" "text",
    "source_text_length" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "source_text" "text",
    "target_count" integer,
    "set_id" "uuid",
    "estimated_time_seconds" integer DEFAULT 5,
    "error_message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generation_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."generation_logs" IS 'Statistics for AI-generated flashcards';



CREATE SEQUENCE IF NOT EXISTS "public"."generation_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."generation_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."generation_logs_id_seq" OWNED BY "public"."generation_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."generation_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "generation_id" bigint NOT NULL,
    "front_content" "text" NOT NULL,
    "back_content" "text" NOT NULL,
    "readability_score" numeric(4,2),
    "is_accepted" boolean DEFAULT false,
    "is_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."generation_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles extending Supabase auth.users';



ALTER TABLE ONLY "public"."generation_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."generation_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."card_personalizations"
    ADD CONSTRAINT "card_personalizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_personalizations"
    ADD CONSTRAINT "card_personalizations_user_id_card_id_key" UNIQUE ("user_id", "card_id");



ALTER TABLE ONLY "public"."card_progress"
    ADD CONSTRAINT "card_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_progress"
    ADD CONSTRAINT "card_progress_user_id_card_id_key" UNIQUE ("user_id", "card_id");



ALTER TABLE ONLY "public"."card_sets"
    ADD CONSTRAINT "card_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards_to_sets"
    ADD CONSTRAINT "cards_to_sets_pkey" PRIMARY KEY ("card_id", "set_id");



ALTER TABLE ONLY "public"."generation_logs"
    ADD CONSTRAINT "generation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generation_results"
    ADD CONSTRAINT "generation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



CREATE INDEX "card_progress_next_review_idx" ON "public"."card_progress" USING "btree" ("user_id", "status", "next_review");



CREATE INDEX "card_sets_not_deleted_idx" ON "public"."card_sets" USING "btree" ("is_deleted") WHERE ("is_deleted" = false);



CREATE INDEX "card_sets_user_id_idx" ON "public"."card_sets" USING "btree" ("user_id");



CREATE INDEX "cards_not_deleted_idx" ON "public"."cards" USING "btree" ("is_deleted") WHERE ("is_deleted" = false);



CREATE INDEX "cards_readability_idx" ON "public"."cards" USING "btree" ("readability_score");



CREATE INDEX "cards_to_sets_set_id_idx" ON "public"."cards_to_sets" USING "btree" ("set_id");



CREATE INDEX "cards_user_id_idx" ON "public"."cards" USING "btree" ("user_id");



CREATE INDEX "cards_user_updated_idx" ON "public"."cards" USING "btree" ("user_id", "updated_at");



CREATE INDEX "generation_results_generation_id_idx" ON "public"."generation_results" USING "btree" ("generation_id");



ALTER TABLE ONLY "public"."card_personalizations"
    ADD CONSTRAINT "card_personalizations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_personalizations"
    ADD CONSTRAINT "card_personalizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."card_progress"
    ADD CONSTRAINT "card_progress_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_progress"
    ADD CONSTRAINT "card_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."card_sets"
    ADD CONSTRAINT "card_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."cards_to_sets"
    ADD CONSTRAINT "cards_to_sets_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards_to_sets"
    ADD CONSTRAINT "cards_to_sets_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."generation_logs"
    ADD CONSTRAINT "generation_logs_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generation_logs"
    ADD CONSTRAINT "generation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."generation_results"
    ADD CONSTRAINT "generation_results_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "public"."generation_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."card_personalizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards_to_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generation_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can delete from cards_to_sets" ON "public"."cards_to_sets" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."cards" "c"
     JOIN "public"."card_sets" "s" ON (true))
  WHERE (("c"."id" = "cards_to_sets"."card_id") AND ("s"."id" = "cards_to_sets"."set_id") AND ("c"."user_id" = "auth"."uid"()) AND ("s"."user_id" = "auth"."uid"())))));



COMMENT ON POLICY "users can delete from cards_to_sets" ON "public"."cards_to_sets" IS 'Allow users to remove cards only when they own both the card and the set';



CREATE POLICY "users can insert into cards_to_sets" ON "public"."cards_to_sets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."cards" "c"
     JOIN "public"."card_sets" "s" ON (true))
  WHERE (("c"."id" = "cards_to_sets"."card_id") AND ("s"."id" = "cards_to_sets"."set_id") AND ("c"."user_id" = "auth"."uid"()) AND ("s"."user_id" = "auth"."uid"()) AND ("c"."is_deleted" = false) AND ("s"."is_deleted" = false)))));



COMMENT ON POLICY "users can insert into cards_to_sets" ON "public"."cards_to_sets" IS 'Allow users to add cards only when they own both the card and the set';



CREATE POLICY "users can insert own generation logs" ON "public"."generation_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "users can insert own generation logs" ON "public"."generation_logs" IS 'Allow users to create generation logs for themselves only';



CREATE POLICY "users can manage own generation results" ON "public"."generation_results" USING ((EXISTS ( SELECT 1
   FROM "public"."generation_logs"
  WHERE (("generation_logs"."id" = "generation_results"."generation_id") AND ("generation_logs"."user_id" = "auth"."uid"())))));



CREATE POLICY "users can update own generation logs" ON "public"."generation_logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "users can update own generation logs" ON "public"."generation_logs" IS 'Allow users to update their own generation logs only';



CREATE POLICY "users can view all cards_to_sets" ON "public"."cards_to_sets" FOR SELECT USING (true);



COMMENT ON POLICY "users can view all cards_to_sets" ON "public"."cards_to_sets" IS 'Allow viewing all cards_to_sets for proper counting and listing operations';



CREATE POLICY "users can view cards_to_sets through cards or sets" ON "public"."cards_to_sets" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."cards" "c"
  WHERE (("c"."id" = "cards_to_sets"."card_id") AND ("c"."user_id" = "auth"."uid"()) AND ("c"."is_deleted" = false)))) OR (EXISTS ( SELECT 1
   FROM "public"."card_sets" "s"
  WHERE (("s"."id" = "cards_to_sets"."set_id") AND ("s"."user_id" = "auth"."uid"()) AND ("s"."is_deleted" = false))))));



COMMENT ON POLICY "users can view cards_to_sets through cards or sets" ON "public"."cards_to_sets" IS 'Allow viewing cards_to_sets entries when the user owns either the card or the set';



CREATE POLICY "users can view own card sets" ON "public"."card_sets" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("is_deleted" = false)));



CREATE POLICY "users can view own cards" ON "public"."cards" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("is_deleted" = false)));



COMMENT ON POLICY "users can view own cards" ON "public"."cards" IS 'Allow users to view their own non-deleted cards';



CREATE POLICY "users can view own generation logs" ON "public"."generation_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "users can view own generation logs" ON "public"."generation_logs" IS 'Allow users to view their own generation logs';





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































REVOKE ALL ON FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_generation"("p_user_id" "uuid", "p_generation_id" bigint, "p_name" "text", "p_description" "text", "p_accepted_cards" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_sync"() TO "service_role";


















GRANT ALL ON TABLE "public"."card_personalizations" TO "anon";
GRANT ALL ON TABLE "public"."card_personalizations" TO "authenticated";
GRANT ALL ON TABLE "public"."card_personalizations" TO "service_role";



GRANT ALL ON TABLE "public"."card_progress" TO "anon";
GRANT ALL ON TABLE "public"."card_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."card_progress" TO "service_role";



GRANT ALL ON TABLE "public"."card_sets" TO "anon";
GRANT ALL ON TABLE "public"."card_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."card_sets" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."cards_to_sets" TO "anon";
GRANT ALL ON TABLE "public"."cards_to_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."cards_to_sets" TO "service_role";



GRANT ALL ON TABLE "public"."generation_logs" TO "anon";
GRANT ALL ON TABLE "public"."generation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."generation_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."generation_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."generation_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."generation_results" TO "anon";
GRANT ALL ON TABLE "public"."generation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."generation_results" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
