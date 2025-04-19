/*
 * Migration: Disable Initial RLS Policies
 * Description: Drops all RLS policies created in the initial schema migration
 * 
 * This migration:
 * - Disables all RLS policies from profiles table
 * - Disables all RLS policies from card_sets table
 * - Disables all RLS policies from cards table
 * - Disables all RLS policies from cards_to_sets table
 * - Disables all RLS policies from card_progress table
 * - Disables all RLS policies from card_personalizations table
 * - Disables all RLS policies from generation_logs table
 * 
 * Note: This is a destructive operation that removes security policies.
 * Make sure to implement new policies before exposing the database to production.
 */

-- Drop policies for profiles table
drop policy if exists "anon users cannot select profiles" on public.profiles;
drop policy if exists "authenticated users can view own profile" on public.profiles;
drop policy if exists "authenticated users can update own profile" on public.profiles;

-- Drop policies for card_sets table
drop policy if exists "anon users cannot select card_sets" on public.card_sets;
drop policy if exists "authenticated users can view own card sets" on public.card_sets;
drop policy if exists "authenticated users can insert own card sets" on public.card_sets;
drop policy if exists "authenticated users can update own card sets" on public.card_sets;
drop policy if exists "authenticated users can delete own card sets" on public.card_sets;

-- Drop policies for cards table
drop policy if exists "anon users cannot select cards" on public.cards;
drop policy if exists "authenticated users can view own cards" on public.cards;
drop policy if exists "authenticated users can insert own cards" on public.cards;
drop policy if exists "authenticated users can update own cards" on public.cards;
drop policy if exists "authenticated users can delete own cards" on public.cards;

-- Drop policies for cards_to_sets table
drop policy if exists "anon users cannot select cards_to_sets" on public.cards_to_sets;
drop policy if exists "authenticated users can view own cards_to_sets" on public.cards_to_sets;
drop policy if exists "authenticated users can insert own cards_to_sets" on public.cards_to_sets;

-- Drop policies for card_progress table
drop policy if exists "anon users cannot select card_progress" on public.card_progress;
drop policy if exists "authenticated users can manage own card progress" on public.card_progress;

-- Drop policies for card_personalizations table
drop policy if exists "anon users cannot select card_personalizations" on public.card_personalizations;
drop policy if exists "authenticated users can manage own personalizations" on public.card_personalizations;

-- Drop policies for generation_logs table
drop policy if exists "anon users cannot select generation_logs" on public.generation_logs;
drop policy if exists "authenticated users can view own generation logs" on public.generation_logs;
drop policy if exists "authenticated users can insert own generation logs" on public.generation_logs;
