-- Fix listings that still have null start_date or end_date
-- These exist because: (a) migration 003 backfill ran once but new nulls could still be inserted,
-- or (b) the date columns were never populated for some records.

-- Backfill any remaining nulls using the 'date' column as ground truth
UPDATE garage_sales
SET start_date = date
WHERE start_date IS NULL AND date IS NOT NULL;

UPDATE garage_sales
SET end_date = COALESCE(start_date, date)
WHERE end_date IS NULL AND (start_date IS NOT NULL OR date IS NOT NULL);

-- Make columns NOT NULL with a sensible default so this can't happen again
ALTER TABLE garage_sales
  ALTER COLUMN start_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN end_date SET DEFAULT CURRENT_DATE;

ALTER TABLE garage_sales
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;
