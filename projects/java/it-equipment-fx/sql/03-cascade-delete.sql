BEGIN;
ALTER TABLE equipment_requests
 DROP CONSTRAINT IF EXISTS equipment_requests_user_id_fkey;
ALTER TABLE equipment_requests
 ADD CONSTRAINT equipment_requests_user_id_fkey
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
COMMIT;
