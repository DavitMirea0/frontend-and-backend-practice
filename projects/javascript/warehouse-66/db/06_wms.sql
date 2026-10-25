-- 06_wms.sql — WMS: перемещение и инвентаризация

ALTER TABLE storage_units
    ADD COLUMN IF NOT EXISTS current_warehouse INT NOT NULL DEFAULT 1;

UPDATE storage_units su
   SET current_warehouse = m.class_code
  FROM materials m
 WHERE m.material_code = su.material_code;

CREATE INDEX IF NOT EXISTS idx_su_current_warehouse
    ON storage_units(current_warehouse);

-- fn_inventory_by_warehouse
CREATE OR REPLACE FUNCTION fn_inventory_by_warehouse(p_warehouse INT)
RETURNS TABLE (
    order_number    INT,
    order_date      DATE,
    material_code   INT,
    material_name   TEXT,
    unit_name       TEXT,
    supplier_name   TEXT,
    quantity        NUMERIC,
    unit_price      NUMERIC,
    total_value     NUMERIC,
    days_on_stock   INT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT su.order_number, su.order_date,
           m.material_code, m.material_name::TEXT,
           u.unit_name::TEXT, s.supplier_name::TEXT,
           su.quantity, su.unit_price,
           (su.quantity * su.unit_price) AS total_value,
           (CURRENT_DATE - su.order_date)::INT
    FROM storage_units su
    JOIN materials m            ON m.material_code  = su.material_code
    JOIN units_of_measurement u ON u.unit_code      = su.unit_code
    JOIN suppliers s            ON s.supplier_code  = su.supplier_code
    WHERE su.current_warehouse = p_warehouse
    ORDER BY su.order_date ASC;
END; $$;

-- fn_inventory_summary
CREATE OR REPLACE FUNCTION fn_inventory_summary()
RETURNS TABLE (
    warehouse_code  INT,
    positions_count BIGINT,
    total_qty       NUMERIC,
    total_value     NUMERIC,
    oldest_days     INT,
    newest_days     INT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT su.current_warehouse,
           COUNT(su.order_number),
           COALESCE(SUM(su.quantity), 0),
           COALESCE(SUM(su.quantity * su.unit_price), 0),
           COALESCE(MAX(CURRENT_DATE - su.order_date)::INT, 0),
           COALESCE(MIN(CURRENT_DATE - su.order_date)::INT, 0)
    FROM storage_units su
    GROUP BY su.current_warehouse
    ORDER BY su.current_warehouse;
END; $$;

-- Добавляем FK user_id в audit_log (связь users → audit_log из ERD)
ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(user_id) ON DELETE SET NULL;

-- Связь audit_log с users (nullable — системные операции без юзера)
ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
