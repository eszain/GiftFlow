-- Migration to update listings table structure
-- Add original_amount column and rename amount_requested to current_amount

-- Step 1: Add the new original_amount column
ALTER TABLE public.listings 
ADD COLUMN original_amount DECIMAL;

-- Step 2: Copy existing amount_requested values to both original_amount and current_amount
UPDATE public.listings 
SET original_amount = amount_requested,
    current_amount = amount_requested;

-- Step 3: Make original_amount NOT NULL after populating it
ALTER TABLE public.listings 
ALTER COLUMN original_amount SET NOT NULL;

-- Step 4: Make current_amount NOT NULL after populating it  
ALTER TABLE public.listings 
ALTER COLUMN current_amount SET NOT NULL;

-- Step 5: Drop the old amount_requested column
ALTER TABLE public.listings 
DROP COLUMN amount_requested;

-- Note: This migration assumes you want to keep the existing amount_raised column
-- for backward compatibility, but the new logic will use current_amount for progress tracking
