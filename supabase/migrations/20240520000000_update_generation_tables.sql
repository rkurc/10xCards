/*
 * Migration: Update Generation Tables
 * Description: Aligns database schema with text processing implementation
 */

-- Update generation_logs table to support our implementation
ALTER TABLE public.generation_logs 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source_text TEXT,
  ADD COLUMN IF NOT EXISTS target_count INTEGER,
  ADD COLUMN IF NOT EXISTS set_id UUID REFERENCES public.card_sets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estimated_time_seconds INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create the missing generation_results table
CREATE TABLE IF NOT EXISTS public.generation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id BIGINT NOT NULL REFERENCES public.generation_logs(id) ON DELETE CASCADE,
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  readability_score NUMERIC(4,2),
  is_accepted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries by generation_id
CREATE INDEX IF NOT EXISTS generation_results_generation_id_idx ON public.generation_results(generation_id);

-- Enable Row Level Security on new table
ALTER TABLE public.generation_results ENABLE ROW LEVEL SECURITY;

-- Create policy for generation_results table
CREATE POLICY "users can manage own generation results" ON public.generation_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.generation_logs 
      WHERE generation_logs.id = generation_results.generation_id 
      AND generation_logs.user_id = auth.uid()
    )
  );
