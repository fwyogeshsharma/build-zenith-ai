-- Update certification_type enum to include all certification types used in the form
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'griha';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'lbc';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'iso_9001';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'iso_45001';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'ohsas';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'green_globes';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'edge';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'sites';
ALTER TYPE certification_type ADD VALUE IF NOT EXISTS 'fitwel';

-- Create certification_status enum for current_status field
CREATE TYPE certification_status AS ENUM (
    'planning',
    'in_progress', 
    'on_hold',
    'achieved',
    'expired'
);

-- Update certifications table to use the enum for current_status
ALTER TABLE certifications ALTER COLUMN current_status TYPE certification_status USING current_status::certification_status;