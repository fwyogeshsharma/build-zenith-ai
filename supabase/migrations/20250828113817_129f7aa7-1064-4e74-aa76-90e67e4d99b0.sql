-- Add start_date and duration fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN start_date DATE,
ADD COLUMN duration_hours NUMERIC;