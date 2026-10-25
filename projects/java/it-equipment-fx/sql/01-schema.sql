BEGIN;
CREATE TABLE users (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL CHECK (length(trim(full_name))>0),
 email VARCHAR(160) NOT NULL UNIQUE CHECK (email=lower(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 department VARCHAR(100) NOT NULL CHECK (length(trim(department))>0)
);
CREATE TABLE equipment_requests (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 equipment_type VARCHAR(20) NOT NULL CHECK (equipment_type IN ('LAPTOP','MONITOR','KEYBOARD','MOUSE','HEADSET')),
 quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
 reason VARCHAR(500) NOT NULL CHECK (length(trim(reason))>0),
 status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','APPROVED','ISSUED','REJECTED','CANCELLED')),
 created_at TIMESTAMP NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX idx_requests_user ON equipment_requests(user_id);
CREATE INDEX idx_requests_status ON equipment_requests(status);
COMMIT;
