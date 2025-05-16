/*
 * Migration: Fix RLS policies for cards_to_sets and card_sets
 * Description: Corrects issues with RLS policies causing join operations and count operations to fail
 */

-- Drop existing policies for cards_to_sets
DROP POLICY IF EXISTS "users can view own cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can insert own cards_to_sets" ON public.cards_to_sets;
DROP POLICY IF EXISTS "users can delete own cards_to_sets" ON public.cards_to_sets;

-- Create RLS policy for cards_to_sets SELECT operations that allows users to view records
-- connected to card sets they own, which is better for security than allowing all records to be viewed
CREATE POLICY "users can view related cards_to_sets" ON public.cards_to_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.card_sets s
      WHERE s.id = cards_to_sets.set_id
      AND s.user_id = auth.uid()
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

-- Fix the RLS policy for cards table to ensure proper joins work
DROP POLICY IF EXISTS "users can view own cards" ON public.cards;

CREATE POLICY "users can view own cards" ON public.cards
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);

-- Add comments
COMMENT ON POLICY "users can view related cards_to_sets" ON public.cards_to_sets IS 'Allow viewing cards_to_sets entries only for sets owned by the user';
COMMENT ON POLICY "users can insert into cards_to_sets" ON public.cards_to_sets IS 'Allow users to add cards only when they own both the card and the set';
COMMENT ON POLICY "users can delete from cards_to_sets" ON public.cards_to_sets IS 'Allow users to remove cards only when they own both the card and the set';
