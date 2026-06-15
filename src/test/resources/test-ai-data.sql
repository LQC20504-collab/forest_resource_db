-- ai_prediction table is missing from schema.sql, add it here
CREATE TABLE IF NOT EXISTS ai_prediction (
    pred_id           BIGINT        NOT NULL AUTO_INCREMENT,
    plot_id           BIGINT        NOT NULL,
    model_id          BIGINT        DEFAULT NULL,
    predicted_volume  DECIMAL(12,4) DEFAULT NULL,
    confidence        DECIMAL(6,4)  DEFAULT NULL,
    predict_time      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pred_id)
);

-- Clean slate for deterministic IDs
DELETE FROM tree;
DELETE FROM plot;
DELETE FROM region;
DELETE FROM species;
DELETE FROM ai_prediction;

-- Test data for AI prediction flow:
-- plot_id = 1, tree_id = 1, species_id = 1, region_id = 1
INSERT INTO region (region_code, name) VALUES ('TEST-REGION', 'Test Region');
INSERT INTO plot (plot_code, region_id) VALUES ('TEST-PLOT-001', 1);
INSERT INTO species (common_name, latin_name) VALUES ('Test Species', 'Testis species');
INSERT INTO tree (plot_id, species_id, tree_number, dbh, height) VALUES (1, 1, 1, 25.5, 18.3);
