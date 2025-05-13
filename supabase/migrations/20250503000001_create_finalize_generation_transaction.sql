-- Transaction function for finalizing flashcard generation
-- This ensures that all operations are performed atomically (all succeed or all fail)
CREATE OR REPLACE FUNCTION public.finalize_generation(
  p_user_id UUID,
  p_generation_id BIGINT,
  p_name TEXT,
  p_description TEXT DEFAULT '',
  p_accepted_cards UUID[] DEFAULT '{}'::UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Set proper permissions for the function
-- Only authenticated users can execute this function
REVOKE EXECUTE ON FUNCTION public.finalize_generation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_generation TO authenticated;