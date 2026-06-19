-- ============================================================
-- Forest Resource Database — Advanced Objects
-- AI森林资源调查数据库 - 存储过程 / 触发器 / 视图
-- ============================================================

USE forest_resource;

-- 重要: 执行前请确保客户端字符集为 utf8mb4，否则触发器中的中文会乱码
-- 在 mysql CLI 中执行: SET NAMES utf8mb4;  SOURCE advanced.sql;

-- ============================================================
-- 1. 存储过程：指定行政区蓄积量汇总
-- sp_region_volume_summary(IN rid BIGINT)
-- 汇总指定行政区下所有样地的实测+预测蓄积量
-- ============================================================

DROP PROCEDURE IF EXISTS sp_region_volume_summary;

DELIMITER $$
CREATE PROCEDURE sp_region_volume_summary(IN rid BIGINT)
BEGIN
    SELECT r.name AS region_name,
           COUNT(DISTINCT p.plot_id) AS plot_count,
           COALESCE(SUM(m.tree_count), 0) AS tree_count,
           COALESCE(SUM(m.measured_volume), 0) AS total_measured_volume,
           COALESCE(SUM(pr.predicted_volume), 0) AS total_predicted_volume,
           COALESCE(SUM(m.measured_volume), 0) - COALESCE(SUM(pr.predicted_volume), 0) AS total_error
    FROM region r
    LEFT JOIN plot p ON r.region_id = p.region_id
    LEFT JOIN (
        SELECT t.plot_id,
               COUNT(DISTINCT t.tree_id) AS tree_count,
               SUM(lv.measured_volume) AS measured_volume
        FROM tree t
        LEFT JOIN (
            SELECT v.tree_id, v.measured_volume
            FROM volume v
            INNER JOIN (
                SELECT tree_id, MAX(measure_date) AS max_date
                FROM volume GROUP BY tree_id
            ) m ON v.tree_id = m.tree_id AND v.measure_date = m.max_date
        ) lv ON t.tree_id = lv.tree_id
        GROUP BY t.plot_id
    ) m ON p.plot_id = m.plot_id
    LEFT JOIN (
        SELECT ap.plot_id, ap.predicted_volume
        FROM ai_prediction ap
        INNER JOIN (
            SELECT plot_id, MAX(predict_time) AS max_time
            FROM ai_prediction GROUP BY plot_id
        ) latest ON ap.plot_id = latest.plot_id AND ap.predict_time = latest.max_time
    ) pr ON p.plot_id = pr.plot_id
    WHERE r.region_id = rid
    GROUP BY r.region_id, r.name;
END$$
DELIMITER ;

-- ============================================================
-- 2. 存储过程：全部行政区蓄积量汇总
-- sp_all_regions_summary()
-- 汇总所有行政区的蓄积量统计（供仪表盘图表使用）
-- ============================================================

DROP PROCEDURE IF EXISTS sp_all_regions_summary;

DELIMITER $$
CREATE PROCEDURE sp_all_regions_summary()
BEGIN
    SELECT r.region_id, r.name AS region_name,
           COUNT(DISTINCT p.plot_id) AS plot_count,
           COALESCE(SUM(m.tree_count), 0) AS tree_count,
           COALESCE(SUM(m.measured_volume), 0) AS total_measured_volume,
           COALESCE(SUM(pr.predicted_volume), 0) AS total_predicted_volume
    FROM region r
    LEFT JOIN plot p ON r.region_id = p.region_id
    LEFT JOIN (
        SELECT t.plot_id,
               COUNT(DISTINCT t.tree_id) AS tree_count,
               SUM(lv.measured_volume) AS measured_volume
        FROM tree t
        LEFT JOIN (
            SELECT v.tree_id, v.measured_volume
            FROM volume v
            INNER JOIN (
                SELECT tree_id, MAX(measure_date) AS max_date
                FROM volume GROUP BY tree_id
            ) m ON v.tree_id = m.tree_id AND v.measure_date = m.max_date
        ) lv ON t.tree_id = lv.tree_id
        GROUP BY t.plot_id
    ) m ON p.plot_id = m.plot_id
    LEFT JOIN (
        SELECT ap.plot_id, ap.predicted_volume
        FROM ai_prediction ap
        INNER JOIN (
            SELECT plot_id, MAX(predict_time) AS max_time
            FROM ai_prediction GROUP BY plot_id
        ) latest ON ap.plot_id = latest.plot_id AND ap.predict_time = latest.max_time
    ) pr ON p.plot_id = pr.plot_id
    GROUP BY r.region_id, r.name
    ORDER BY r.region_id;
END$$
DELIMITER ;

-- ============================================================
-- 3. 触发器：AI预测插入后自动记录操作日志
-- trg_ai_prediction_after_insert
-- 当 ai_prediction 表新增记录时，自动向 operation_log 写入日志
-- ============================================================

DROP TRIGGER IF EXISTS trg_ai_prediction_after_insert;

DELIMITER $$
CREATE TRIGGER trg_ai_prediction_after_insert
AFTER INSERT ON ai_prediction
FOR EACH ROW
BEGIN
    INSERT INTO operation_log(user_id, operation, operation_time, details)
    VALUES (1, '新增AI预测', NOW(),
            CONCAT('样地ID:', NEW.plot_id, ' 预测蓄积量:', NEW.predicted_volume, ' 置信度:', NEW.confidence));
END$$
DELIMITER ;

-- ============================================================
-- 4. 视图：分区统计视图
-- v_region_stats
-- 展示每个行政区的样地/树木/实测蓄积/预测蓄积/误差 统计
-- ============================================================

CREATE OR REPLACE VIEW v_region_stats AS
SELECT r.region_id, r.name AS region_name,
       COUNT(DISTINCT p.plot_id) AS plot_count,
       COALESCE(SUM(m.tree_count), 0) AS tree_count,
       COALESCE(SUM(m.measured_volume), 0) AS total_measured_volume,
       COALESCE(SUM(pr.predicted_volume), 0) AS total_predicted_volume,
       COALESCE(SUM(m.measured_volume), 0) - COALESCE(SUM(pr.predicted_volume), 0) AS avg_error
FROM region r
LEFT JOIN plot p ON r.region_id = p.region_id
LEFT JOIN (
    SELECT t.plot_id,
           COUNT(DISTINCT t.tree_id) AS tree_count,
           SUM(lv.measured_volume) AS measured_volume
    FROM tree t
    LEFT JOIN (
        SELECT v.tree_id, v.measured_volume
        FROM volume v
        INNER JOIN (
            SELECT tree_id, MAX(measure_date) AS max_date
            FROM volume GROUP BY tree_id
        ) m ON v.tree_id = m.tree_id AND v.measure_date = m.max_date
    ) lv ON t.tree_id = lv.tree_id
    GROUP BY t.plot_id
) m ON p.plot_id = m.plot_id
LEFT JOIN (
    SELECT ap.plot_id, ap.predicted_volume
    FROM ai_prediction ap
    INNER JOIN (
        SELECT plot_id, MAX(predict_time) AS max_time
        FROM ai_prediction GROUP BY plot_id
    ) latest ON ap.plot_id = latest.plot_id AND ap.predict_time = latest.max_time
) pr ON p.plot_id = pr.plot_id
GROUP BY r.region_id, r.name;

-- ============================================================
-- 5. 视图：样地汇总视图
-- v_plot_summary
-- 展示每个样地的代码、所属区域、树木数量、实测蓄积、AI预测蓄积
-- ============================================================

CREATE OR REPLACE VIEW v_plot_summary AS
SELECT p.plot_id, p.plot_code, r.name AS region_name,
       COALESCE(m.tree_count, 0) AS tree_count,
       COALESCE(m.measured_volume, 0) AS total_volume,
       COALESCE(pr.predicted_volume, 0) AS ai_predicted_volume
FROM plot p
LEFT JOIN region r ON p.region_id = r.region_id
LEFT JOIN (
    SELECT t.plot_id,
           COUNT(DISTINCT t.tree_id) AS tree_count,
           SUM(lv.measured_volume) AS measured_volume
    FROM tree t
    LEFT JOIN (
        SELECT v.tree_id, v.measured_volume
        FROM volume v
        INNER JOIN (
            SELECT tree_id, MAX(measure_date) AS max_date
            FROM volume GROUP BY tree_id
        ) m ON v.tree_id = m.tree_id AND v.measure_date = m.max_date
    ) lv ON t.tree_id = lv.tree_id
    GROUP BY t.plot_id
) m ON p.plot_id = m.plot_id
LEFT JOIN (
    SELECT ap.plot_id, ap.predicted_volume
    FROM ai_prediction ap
    INNER JOIN (
        SELECT plot_id, MAX(predict_time) AS max_time
        FROM ai_prediction GROUP BY plot_id
    ) latest ON ap.plot_id = latest.plot_id AND ap.predict_time = latest.max_time
) pr ON p.plot_id = pr.plot_id;
