-- Add columns for detailed guest composition
ALTER TABLE bookings 
ADD COLUMN adults INTEGER DEFAULT 1,
ADD COLUMN children INTEGER DEFAULT 0,
ADD COLUMN infants INTEGER DEFAULT 0,
ADD COLUMN pets INTEGER DEFAULT 0;
