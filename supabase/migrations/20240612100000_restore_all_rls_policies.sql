/*
 * Migration: Restore All RLS Policies
 * Description: Restores Row Level Security policies for all tables after they were dropped
 * 
 * This migration:
 * - Creates policies for profiles table
 * - Creates policies for card_sets table
 * - Creates policies for cards table
 * - Creates policies for cards_to_sets table
 * - Creates policies for card_progress table
 * - Creates policies for card_personalizations table
 */

-- Create RLS policies for profiles table
CREATE POLICY "users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create RLS policies for card_sets table
CREATE POLICY "users can view own card sets"
  ON public.card_sets
  FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "users can insert own card sets"
  ON public.card_sets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own card sets"
  ON public.card_sets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own card sets"
  ON public.card_sets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for cards table
CREATE POLICY "users can view own cards"
  ON public.cards
  FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "users can insert own cards"
  ON public.cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own cards"
  ON public.cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete own cards"
  ON public.cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for cards_to_sets table
CREATE POLICY "users can view own cards_to_sets"
  ON public.cards_to_sets
  FOR SELECT
  USING (EXISTS (
      SELECT 1 FROM public.cards 
      WHERE id = cards_to_sets.card_id 
      AND user_id = auth.uid() 
      AND is_deleted = false
  ));

CREATE POLICY "users can insert own cards_to_sets"
  ON public.cards_to_sets
  FOR INSERT
  WITH CHECK (EXISTS (
      SELECT 1 FROM public.cards 
      WHERE id = cards_to_sets.card_id 
      AND user_id = auth.uid() 
      AND is_deleted = false
  ));

CREATE POLICY "users can delete own cards_to_sets"
  ON public.cards_to_sets
  FOR DELETE
  USING (EXISTS (
      SELECT 1 FROM public.cards 
      WHERE id = cards_to_sets.card_id 
      AND user_id = auth.uid() 
      AND is_deleted = false
  ));

-- Create RLS policies for card_progress table
CREATE POLICY "users can manage own card progress"
  ON public.card_progress
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for card_personalizations table
CREATE POLICY "users can manage own personalizations"
  ON public.card_personalizations
  FOR ALL
  USING (auth.uid() = user_id);

-- Add comments for clarity
COMMENT ON POLICY "users can view own profile" ON public.profiles IS 'Allow users to view their own profile';
COMMENT ON POLICY "users can update own profile" ON public.profiles IS 'Allow users to update their own profile';

COMMENT ON POLICY "users can view own card sets" ON public.card_sets IS 'Allow users to view their own card sets';
COMMENT ON POLICY "users can insert own card sets" ON public.card_sets IS 'Allow users to create their own card sets';
COMMENT ON POLICY "users can update own card sets" ON public.card_sets IS 'Allow users to update their own card sets';
COMMENT ON POLICY "users can delete own card sets" ON public.card_sets IS 'Allow users to delete their own card sets';

COMMENT ON POLICY "users can view own cards" ON public.cards IS 'Allow users to view their own cards';
COMMENT ON POLICY "users can insert own cards" ON public.cards IS 'Allow users to create their own cards';
COMMENT ON POLICY "users can update own cards" ON public.cards IS 'Allow users to update their own cards';
COMMENT ON POLICY "users can delete own cards" ON public.cards IS 'Allow users to delete their own cards';

COMMENT ON POLICY "users can view own cards_to_sets" ON public.cards_to_sets IS 'Allow users to view relationships for their own cards';
COMMENT ON POLICY "users can insert own cards_to_sets" ON public.cards_to_sets IS 'Allow users to create relationships for their own cards';
COMMENT ON POLICY "users can delete own cards_to_sets" ON public.cards_to_sets IS 'Allow users to delete relationships for their own cards';

COMMENT ON POLICY "users can manage own card progress" ON public.card_progress IS 'Allow users to manage their own card progress';
COMMENT ON POLICY "users can manage own personalizations" ON public.card_personalizations IS 'Allow users to manage their own card personalizations';
