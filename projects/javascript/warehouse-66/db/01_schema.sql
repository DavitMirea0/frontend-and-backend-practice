-- =============================================================
-- Задание №66. База данных склада
-- Схема: справочники + единицы хранения
-- =============================================================

DROP TABLE IF EXISTS storage_units CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS units_of_measurement CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- ---------- Справочник единиц измерения ----------
CREATE TABLE units_of_measurement (
    unit_code   SERIAL PRIMARY KEY,
    unit_name   VARCHAR(30) NOT NULL UNIQUE   -- метр, кг, литр, шт
);

-- ---------- Справочник материалов ----------
CREATE TABLE materials (
    material_code     SERIAL PRIMARY KEY,
    class_code        INT    NOT NULL,        -- код класса
    group_code        INT    NOT NULL,        -- код группы
    material_name     VARCHAR(150) NOT NULL,
    unit_code         INT    NOT NULL
        REFERENCES units_of_measurement(unit_code)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_materials_name ON materials(material_name);

-- ---------- Справочник поставщиков ----------
CREATE TABLE suppliers (
    supplier_code     SERIAL PRIMARY KEY,
    supplier_name     VARCHAR(150) NOT NULL,
    inn               VARCHAR(12)  NOT NULL UNIQUE,

    -- юридический адрес
    legal_zip         VARCHAR(10),
    legal_city        VARCHAR(80),
    legal_street      VARCHAR(120),
    legal_house       VARCHAR(20),

    -- адрес банка
    bank_zip          VARCHAR(10),
    bank_city         VARCHAR(80),
    bank_street       VARCHAR(120),
    bank_house        VARCHAR(20),

    bank_account      VARCHAR(20) NOT NULL
);
CREATE INDEX idx_suppliers_bank_city ON suppliers(bank_city);

-- ---------- Справочник сопроводительных документов ----------
CREATE TABLE documents (
    document_code     SERIAL PRIMARY KEY,
    document_name     VARCHAR(120) NOT NULL UNIQUE   -- ТТН, счёт-фактура и т.д.
);

-- ---------- Единицы хранения (приходные ордеры) ----------
CREATE TABLE storage_units (
    order_number      SERIAL PRIMARY KEY,
    order_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_code     INT  NOT NULL
        REFERENCES suppliers(supplier_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    balance_account   VARCHAR(20) NOT NULL,           -- балансный счёт
    document_code     INT  NOT NULL
        REFERENCES documents(document_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    document_number   VARCHAR(40) NOT NULL,
    material_code     INT  NOT NULL
        REFERENCES materials(material_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    material_account  VARCHAR(20) NOT NULL,           -- счёт материала
    unit_code         INT  NOT NULL
        REFERENCES units_of_measurement(unit_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    quantity          NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
    unit_price        NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX idx_storage_supplier ON storage_units(supplier_code);
CREATE INDEX idx_storage_material ON storage_units(material_code);
CREATE INDEX idx_storage_date     ON storage_units(order_date);
