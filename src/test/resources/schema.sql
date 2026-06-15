-- H2-compatible schema for mapper tests.
-- "USER" is a reserved keyword in H2; use uppercase double-quoted "USER"
-- so that the overridden UserMapper.xml (also using "USER") can reference it.
-- All other table names are not H2 reserved words.

CREATE TABLE IF NOT EXISTS user (
    user_id     BIGINT       NOT NULL AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  DEFAULT NULL,
    real_name   VARCHAR(50)  DEFAULT NULL,
    phone       VARCHAR(20)  DEFAULT NULL,
    create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS region (
    region_id   BIGINT       NOT NULL AUTO_INCREMENT,
    region_code VARCHAR(20)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT       DEFAULT NULL,
    level       INT          DEFAULT NULL,
    PRIMARY KEY (region_id),
    UNIQUE (region_code)
);

CREATE TABLE IF NOT EXISTS plot (
    plot_id     BIGINT        NOT NULL AUTO_INCREMENT,
    plot_code   VARCHAR(50)   NOT NULL,
    region_id   BIGINT        NOT NULL,
    latitude    DECIMAL(10,6)  DEFAULT NULL,
    longitude   DECIMAL(10,6)  DEFAULT NULL,
    elevation   DECIMAL(8,2)   DEFAULT NULL,
    area        DECIMAL(10,4)  DEFAULT NULL,
    survey_year INT           DEFAULT NULL,
    plot_type   VARCHAR(20)   DEFAULT NULL,
    description VARCHAR(1000) DEFAULT NULL,
    PRIMARY KEY (plot_id),
    UNIQUE (plot_code)
);

CREATE TABLE IF NOT EXISTS species (
    species_id         BIGINT       NOT NULL AUTO_INCREMENT,
    common_name        VARCHAR(100) NOT NULL,
    latin_name         VARCHAR(200) DEFAULT NULL,
    wood_density       DECIMAL(10,4) DEFAULT NULL,
    carbon_coefficient DECIMAL(10,4) DEFAULT NULL,
    PRIMARY KEY (species_id)
);

CREATE TABLE IF NOT EXISTS tree (
    tree_id       BIGINT      NOT NULL AUTO_INCREMENT,
    plot_id       BIGINT      NOT NULL,
    species_id    BIGINT      NOT NULL,
    tree_number   INT         DEFAULT NULL,
    dbh           DECIMAL(8,2) DEFAULT NULL,
    height        DECIMAL(8,2) DEFAULT NULL,
    age           INT         DEFAULT NULL,
    health_status VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (tree_id)
);

CREATE TABLE IF NOT EXISTS volume (
    vol_id          BIGINT        NOT NULL AUTO_INCREMENT,
    tree_id         BIGINT        NOT NULL,
    measured_volume DECIMAL(12,4) DEFAULT NULL,
    measure_date    DATE          DEFAULT NULL,
    PRIMARY KEY (vol_id)
);
