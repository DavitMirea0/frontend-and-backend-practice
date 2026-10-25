-- =============================================================================
--  Evervess — инициализация базы данных
--  Схема восстановлена по реальному коду роутов (auth/cards/scores/transactions/admin)
-- =============================================================================

-- -----------------------------------------------------------------------------
--  Роли  (таблица называется "role", не "roles")
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO role (id, name) VALUES
    (1, 'Superadmin'),
    (2, 'Client'),
    (3, 'Admin')
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
--  Пользователи
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255),
    login         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    phone         VARCHAR(20),
    role_id       INTEGER       NOT NULL REFERENCES role(id) DEFAULT 2,
    is_blocked    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
--  category = типы карт (Дебетовая/Кредитная/Виртуальная)
--  cards.js GET /categories возвращает эту таблицу для дропдауна "Тип карты"
--  cards.js: isCredit = category_id === 2
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO category (id, name) VALUES
    (1, 'Дебетовая'),
    (2, 'Кредитная'),
    (3, 'Виртуальная')
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
--  Карты
--  owner_id (не user_id), number_card (не card_number), cvc, date_finish
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS card (
    id            SERIAL PRIMARY KEY,
    number_card   VARCHAR(16)   NOT NULL UNIQUE,
    balance       DECIMAL(15,2) NOT NULL DEFAULT 0,
    date_finish   DATE,
    cvc           VARCHAR(3),
    owner_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   INTEGER       NOT NULL REFERENCES category(id) DEFAULT 1,
    credit_limit  DECIMAL(15,2) NOT NULL DEFAULT 0,
    daily_limit   DECIMAL(15,2) NOT NULL DEFAULT 50000,
    monthly_limit DECIMAL(15,2) NOT NULL DEFAULT 500000,
    is_blocked    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
--  Типы накопительных счетов
--  таблица "score_type" (не score_types), колонка "percent" (не interest_rate)
--  /admin/tariffs работает именно с этой таблицей
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score_type (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE,
    percent DECIMAL(5,2) NOT NULL DEFAULT 0
);

INSERT INTO score_type (id, name, percent) VALUES
    (1, 'Текущий',        0.00),
    (2, 'Сберегательный', 7.00),
    (3, 'Депозитный',    10.50)
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
--  Накопительные счета
--  owner_id (не user_id), number_score, date_finish
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS score (
    id            SERIAL PRIMARY KEY,
    number_score  VARCHAR(20)   NOT NULL UNIQUE,
    balance       DECIMAL(15,2) NOT NULL DEFAULT 0,
    date_finish   DATE,
    owner_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_type_id INTEGER       NOT NULL REFERENCES score_type(id) DEFAULT 1,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
--  Статусы транзакций
--  Код везде вставляет status_id=2 → "Выполнено"
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_status (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO transaction_status (id, name) VALUES
    (1, 'В обработке'),
    (2, 'Выполнено'),
    (3, 'Отклонено')
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
--  Транзакции
--  sum (не amount), id_card_sender/id_card_address/id_score_sender
--  id_score_adress — опечатка намеренно сохранена (так в коде transactions.js)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction (
    id               SERIAL PRIMARY KEY,
    id_card_sender   INTEGER       REFERENCES card(id)  ON DELETE SET NULL,
    id_card_address  INTEGER       REFERENCES card(id)  ON DELETE SET NULL,
    id_score_sender  INTEGER       REFERENCES score(id) ON DELETE SET NULL,
    id_score_adress  INTEGER       REFERENCES score(id) ON DELETE SET NULL,
    sum              DECIMAL(15,2) NOT NULL,
    status_id        INTEGER       NOT NULL REFERENCES transaction_status(id) DEFAULT 2,
    description      TEXT,
    tx_type          VARCHAR(50),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);
