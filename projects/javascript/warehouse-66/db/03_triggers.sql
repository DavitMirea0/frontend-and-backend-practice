-- =============================================================
-- Триггеры для каскадных изменений в связанных таблицах
-- =============================================================

-- Журнал операций — для главного окна "Журнал операций"
CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    ts          TIMESTAMP NOT NULL DEFAULT NOW(),
    op_type     VARCHAR(10) NOT NULL,   -- INSERT / UPDATE / DELETE
    entity      VARCHAR(40) NOT NULL,   -- имя таблицы
    entity_id   VARCHAR(40),
    message     TEXT NOT NULL
);

-- ---------- Триггер: смена кода материала → каскад по storage_units ----------
-- (даже несмотря на ON UPDATE CASCADE — на случай, если изменилась ещё и ед. изм.
-- материала, нужно подтянуть unit_code в существующих ордерах)
CREATE OR REPLACE FUNCTION trg_materials_after_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.unit_code IS DISTINCT FROM OLD.unit_code THEN
        UPDATE storage_units
           SET unit_code = NEW.unit_code
         WHERE material_code = NEW.material_code;

        INSERT INTO audit_log(op_type, entity, entity_id, message)
        VALUES ('UPDATE', 'materials', NEW.material_code::TEXT,
                FORMAT('Ед. измерения материала "%s" изменена: %s → %s. Каскад по storage_units.',
                       NEW.material_name, OLD.unit_code, NEW.unit_code));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS materials_after_update ON materials;
CREATE TRIGGER materials_after_update
AFTER UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION trg_materials_after_update();

-- ---------- Триггер аудита ордеров ----------
CREATE OR REPLACE FUNCTION trg_storage_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log(op_type, entity, entity_id, message)
        VALUES ('INSERT', 'storage_units', NEW.order_number::TEXT,
                FORMAT('Приход: ордер №%s, материал %s, кол-во %s, сумма %s',
                       NEW.order_number, NEW.material_code,
                       NEW.quantity, NEW.quantity * NEW.unit_price));
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log(op_type, entity, entity_id, message)
        VALUES ('UPDATE', 'storage_units', NEW.order_number::TEXT,
                FORMAT('Ордер №%s изменён', NEW.order_number));
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log(op_type, entity, entity_id, message)
        VALUES ('DELETE', 'storage_units', OLD.order_number::TEXT,
                FORMAT('Ордер №%s удалён', OLD.order_number));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS storage_audit ON storage_units;
CREATE TRIGGER storage_audit
AFTER INSERT OR UPDATE OR DELETE ON storage_units
FOR EACH ROW
EXECUTE FUNCTION trg_storage_audit();

-- ---------- Триггер: запрет удаления поставщика, у которого есть приходы ----------
CREATE OR REPLACE FUNCTION trg_suppliers_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage_units WHERE supplier_code = OLD.supplier_code) THEN
        RAISE EXCEPTION 'Нельзя удалить поставщика "%": есть связанные приходы', OLD.supplier_name;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS suppliers_before_delete ON suppliers;
CREATE TRIGGER suppliers_before_delete
BEFORE DELETE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION trg_suppliers_before_delete();
