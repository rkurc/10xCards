/*
 * Migration: Fix RLS policies for cards_to_sets and card_sets
 * Description: Corrects potential issues with RLS policies causing count operations to fail
 */

-- Drop existing policies for cards_to_sets
DROP POLICY IF EXISTS "users can view own cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can insert own cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can delete own cards_to_sets" ON public.cards_to_sets;

-- Create a simplified RLS policy for cards_to_sets SELECT operations
CREATE POLICY "users can view all cards_to_sets" ON public.cards_to_sets
  FOR SELECT USING (true);

-- Create a better policy for INSERT operations, checking both card and set ownership
CREATE POLICY "users can insert into cards_to_sets" ON public.cards_to_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.card_sets s ON true
      WHERE c.id = cards_to_sets.card_id
      AND s.id = cards_to_sets.set_id
      AND c.user_id = auth.uid()
      AND s.user_id = auth.uid()
    )
  );

-- Create a better policy for DELETE operations
CREATE POLICY "users can delete from cards_to_sets" ON public.cards_to_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.card_sets s ON true
      WHERE c.id = cards_to_sets.card_id
      AND s.id = cards_to_sets.set_id
      AND c.user_id = auth.uid()
      AND s.user_id = auth.uid()
    )
  );

-- Update card_sets policy to support counting operations properly
DROP POLICY IF EXISTS "users can view own card sets" ON public.card_sets;

CREATE POLICY "users can view own card sets" ON public.card_sets
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

-- Add comments
COMMENT ON POLICY "users can view all cards_to_sets" ON public.cards_to_sets IS 'Allow viewing all cards_to_sets for proper counting and listing operations';
COMMENT ON POLICY "users can insert into cards_to_sets" ON public.cards_to_sets IS 'Allow users to add cards only when they own both the card and the set';
COMMENT ON POLICY "users can delete from cards_to_sets" ON public.cards_to_sets IS 'Allow users to remove cards only when they own both the card and the set';
