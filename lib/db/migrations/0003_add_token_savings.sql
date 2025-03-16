ALTER TABLE Invoice ADD COLUMN tokensSaved integer DEFAULT 0;
ALTER TABLE Invoice ADD COLUMN usedCache integer DEFAULT 0; 