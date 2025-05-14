/*
 * Migration: Add Generation Logs RLS Policies
 * Description: Adds Row Level Security policies for the generation_logs table
 * 
 * This migration:
 * - Creates policies for SELECT, INSERT, UPDATE operations on generation_logs
 * - Allows authenticated users to manage their own generation logs
 */

-- Create policy for selecting generation logs (only own logs)
CREATE POLICY "users can view own generation logs"
  ON public.generation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for inserting generation logs (only own logs)
CREATE POLICY "users can insert own generation logs"
  ON public.generation_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for updating generation logs (only own logs)
CREATE POLICY "users can update own generation logs"
  ON public.generation_logs 
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comments for clarity
COMMENT ON POLICY "users can view own generation logs" ON public.generation_logs IS 'Allow users to view their own generation logs';
COMMENT ON POLICY "users can insert own generation logs" ON public.generation_logs IS 'Allow users to create generation logs for themselves only';
COMMENT ON POLICY "users can update own generation logs" ON public.generation_logs IS 'Allow users to update their own generation logs only';
