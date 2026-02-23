-- Add company and role columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS role text;