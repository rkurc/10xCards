/*
 * Migration: Finalize Generation Procedure
 * Description: Creates a stored procedure for finalizing the generation process
 * 
 * Note: This migration is now a placeholder since the finalize_generation function
 * has already been created in a previous migration. This migration would have created
 * the finalize_generation function if it didn't already exist.
 */

-- Check if function exists and skip creation if it does
DO $$
BEGIN
  -- Add a comment on the function if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'finalize_generation' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    COMMENT ON FUNCTION public.finalize_generation IS 'Finalizes the generation process by creating a card set and linking accepted cards';
  END IF;
END
$$;
