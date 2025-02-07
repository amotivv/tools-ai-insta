-- Drop the Session table since we're using JWT strategy
DROP TABLE IF EXISTS "Session";

-- Remove the sessions field from User model
ALTER TABLE "User" DROP COLUMN IF EXISTS "sessions";
