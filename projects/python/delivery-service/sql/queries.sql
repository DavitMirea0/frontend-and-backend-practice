-- name: zones
SELECT * FROM zones ORDER BY name;
-- name: count
SELECT COUNT(*) AS total FROM deliveries;
-- name: list
SELECT d.*, z.name AS zone_name, z.capacity, z.zone_type
FROM deliveries d LEFT JOIN zones z ON d.zone_id = z.id
WHERE d.boxes >= ? ORDER BY {order} LIMIT ?;
-- name: detail
SELECT d.*, z.name AS zone_name, z.capacity, z.zone_type
FROM deliveries d LEFT JOIN zones z ON d.zone_id = z.id WHERE d.slug = ?;
-- name: statistics
SELECT goods_type, COUNT(*) AS total, SUM(boxes) AS boxes
FROM deliveries GROUP BY goods_type HAVING COUNT(*) >= ? ORDER BY total DESC, goods_type;

-- name: update_status
UPDATE deliveries SET status = ? WHERE slug = ?;
