/*
 * Migration: Update Cards RLS Policies
 * Description: Further improves RLS policies to fix issues with card joins
 */

-- Fix the RLS policy for cards table to ensure proper joins work
DROP POLICY IF EXISTS "users can view own cards" ON public.cards;

CREATE POLICY "users can view own cards" ON public.cards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

-- Recreate cards_to_sets policies with better join support
DROP POLICY IF EXISTS "users can view related cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can insert into cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can delete from cards_to_sets" ON public.cards_to_sets;

-- Create a policy that allows viewing cards_to_sets linked to user's sets OR cards
CREATE POLICY "users can view cards_to_sets through cards or sets" ON public.cards_to_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = cards_to_sets.card_id
      AND c.user_id = auth.uid() 
      AND c.is_deleted = false
    ) OR 
    EXISTS (
      SELECT 1 FROM public.card_sets s
      WHERE s.id = cards_to_sets.set_id
      AND s.user_id = auth.uid() 
      AND s.is_deleted = false
    )
  );

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
      AND c.is_deleted = false
      AND s.is_deleted = false
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

-- Add comments
COMMENT ON POLICY "users can view own cards" ON public.cards IS 'Allow users to view their own non-deleted cards';
COMMENT ON POLICY "users can view cards_to_sets through cards or sets" ON public.cards_to_sets IS 'Allow viewing cards_to_sets entries when the user owns either the card or the set';
COMMENT ON POLICY "users can insert into cards_to_sets" ON public.cards_to_sets IS 'Allow users to add cards only when they own both the card and the set';
COMMENT ON POLICY "users can delete from cards_to_sets" ON public.cards_to_sets IS 'Allow users to remove cards only when they own both the card and the set';
