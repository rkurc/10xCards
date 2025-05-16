-- Add RLS policy specifically for soft deleting card sets
-- First, drop the existing update policy if it exists
DROP POLICY IF EXISTS "users can update own card sets" ON "public"."card_sets";

-- Create a general update policy that restricts to user's own card sets
CREATE POLICY "users can update own card sets" ON "public"."card_sets" 
FOR UPDATE 
USING (
  "auth"."uid"() = "user_id"
);

COMMENT ON POLICY "users can update own card sets" ON "public"."card_sets" IS 'Allow users to update their own card sets';

-- Create a specific policy for soft deletion
DROP POLICY IF EXISTS "users can soft delete own card sets" ON "public"."card_sets";
CREATE POLICY "users can soft delete own card sets" ON "public"."card_sets" 
FOR UPDATE 
USING (
  "auth"."uid"() = "user_id"
);

COMMENT ON POLICY "users can soft delete own card sets" ON "public"."card_sets" IS 'Allow users to soft delete their own card sets by setting is_deleted to true';
