-- =============================================================
-- Пакет PL/pgSQL: процедуры и функции по заданию №66
-- =============================================================

-- 1. Посчитать количество поставщиков данного материала
--    (через сколько разных поставщиков этот материал поступал на склад)
CREATE OR REPLACE FUNCTION fn_count_suppliers_of_material(p_material_code INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(DISTINCT supplier_code)
      INTO v_count
      FROM storage_units
     WHERE material_code = p_material_code;

    RETURN COALESCE(v_count, 0);
END;
$$;

-- 2. Добавление единицы хранения с указанием всех реквизитов
CREATE OR REPLACE PROCEDURE sp_add_storage_unit(
    p_order_date       DATE,
    p_supplier_code    INT,
    p_balance_account  VARCHAR,
    p_document_code    INT,
    p_document_number  VARCHAR,
    p_material_code    INT,
    p_material_account VARCHAR,
    p_unit_code        INT,
    p_quantity         NUMERIC,
    p_unit_price       NUMERIC,
    OUT  p_new_order_number INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- проверки ссылочной целостности произойдут через FK,
    -- но дадим понятные сообщения заранее
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_code = p_supplier_code) THEN
        RAISE EXCEPTION 'Поставщик с кодом % не найден', p_supplier_code;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM materials WHERE material_code = p_material_code) THEN
        RAISE EXCEPTION 'Материал с кодом % не найден', p_material_code;
    END IF;
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Количество должно быть положительным, получено %', p_quantity;
    END IF;

    INSERT INTO storage_units (
        order_date, supplier_code, balance_account,
        document_code, document_number,
        material_code, material_account,
        unit_code, quantity, unit_price
    )
    VALUES (
        COALESCE(p_order_date, CURRENT_DATE),
        p_supplier_code, p_balance_account,
        p_document_code, p_document_number,
        p_material_code, p_material_account,
        p_unit_code, p_quantity, p_unit_price
    )
    RETURNING order_number INTO p_new_order_number;

    RAISE NOTICE 'Добавлена единица хранения, ордер №%', p_new_order_number;
END;
$$;

-- 3. Список поставщиков, поставлявших данный материал, со всеми реквизитами
CREATE OR REPLACE FUNCTION fn_suppliers_of_material(p_material_code INT)
RETURNS TABLE (
    supplier_code  INT,
    supplier_name  VARCHAR,
    inn            VARCHAR,
    legal_address  TEXT,
    bank_address   TEXT,
    bank_account   VARCHAR,
    total_quantity NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.supplier_code,
           s.supplier_name,
           s.inn,
           CONCAT_WS(', ',
               NULLIF(s.legal_zip,    ''),
               NULLIF(s.legal_city,   ''),
               NULLIF(s.legal_street, ''),
               NULLIF(s.legal_house,  '')
           )::TEXT  AS legal_address,
           CONCAT_WS(', ',
               NULLIF(s.bank_zip,    ''),
               NULLIF(s.bank_city,   ''),
               NULLIF(s.bank_street, ''),
               NULLIF(s.bank_house,  '')
           )::TEXT  AS bank_address,
           s.bank_account,
           SUM(su.quantity) AS total_quantity
      FROM suppliers s
      JOIN storage_units su ON su.supplier_code = s.supplier_code
     WHERE su.material_code = p_material_code
     GROUP BY s.supplier_code
     ORDER BY s.supplier_name;
END;
$$;

-- 4. Для указанного адреса банка (город) — кол-во поставщиков склада,
--    пользующихся услугами этого банка
CREATE OR REPLACE FUNCTION fn_count_suppliers_by_bank_city(p_bank_city VARCHAR)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(DISTINCT s.supplier_code)
      INTO v_count
      FROM suppliers s
     WHERE LOWER(s.bank_city) = LOWER(p_bank_city)
       AND EXISTS (SELECT 1 FROM storage_units su WHERE su.supplier_code = s.supplier_code);

    RETURN COALESCE(v_count, 0);
END;
$$;
