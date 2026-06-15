-- ============================================================
-- Forest Resource Database Schema
-- AI森林资源调查数据库 - 完整DDL脚本
-- ============================================================

CREATE DATABASE IF NOT EXISTS forest_resource DEFAULT CHARSET utf8mb4;
USE forest_resource;

-- ============================================================
-- 1. user — 用户表
-- ============================================================
CREATE TABLE user (
    user_id     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    username    VARCHAR(50)  NOT NULL COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    role        VARCHAR(20)           DEFAULT NULL COMMENT '角色',
    real_name   VARCHAR(50)           DEFAULT NULL COMMENT '真实姓名',
    phone       VARCHAR(20)           DEFAULT NULL COMMENT '联系电话',
    create_time DATETIME              DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. region — 行政区表（自关联层级）
-- ============================================================
CREATE TABLE region (
    region_id   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '行政区ID',
    region_code VARCHAR(20)  NOT NULL COMMENT '行政区代码',
    name        VARCHAR(100) NOT NULL COMMENT '行政区名称',
    parent_id   BIGINT                DEFAULT NULL COMMENT '父级行政区ID',
    level       INT                   DEFAULT NULL COMMENT '层级(1省/2市/3区县)',
    PRIMARY KEY (region_id),
    UNIQUE KEY uk_region_code (region_code),
    KEY idx_parent_id (parent_id),
    CONSTRAINT fk_region_parent FOREIGN KEY (parent_id) REFERENCES region (region_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行政区表';

-- ============================================================
-- 3. species — 树种表
-- ============================================================
CREATE TABLE species (
    species_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '树种ID',
    common_name        VARCHAR(100) NOT NULL COMMENT '常用名',
    latin_name         VARCHAR(200)          DEFAULT NULL COMMENT '拉丁学名',
    wood_density       DECIMAL(10,4)         DEFAULT NULL COMMENT '木材密度(g/cm³)',
    carbon_coefficient DECIMAL(10,4)         DEFAULT NULL COMMENT '含碳系数',
    PRIMARY KEY (species_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='树种表';

-- ============================================================
-- 4. plot — 样地表
-- ============================================================
CREATE TABLE plot (
    plot_id     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '样地ID',
    plot_code   VARCHAR(50)  NOT NULL COMMENT '样地代码',
    region_id   BIGINT       NOT NULL COMMENT '所属行政区ID',
    latitude    DECIMAL(10,6)         DEFAULT NULL COMMENT '纬度',
    longitude   DECIMAL(10,6)         DEFAULT NULL COMMENT '经度',
    elevation   DECIMAL(8,2)          DEFAULT NULL COMMENT '海拔(m)',
    area        DECIMAL(10,4)         DEFAULT NULL COMMENT '样地面积(公顷)',
    survey_year INT                   DEFAULT NULL COMMENT '调查年份',
    plot_type   VARCHAR(20)           DEFAULT NULL COMMENT '样地类型',
    description TEXT                   COMMENT '描述',
    PRIMARY KEY (plot_id),
    UNIQUE KEY uk_plot_code (plot_code),
    KEY idx_region_id (region_id),
    CONSTRAINT fk_plot_region FOREIGN KEY (region_id) REFERENCES region (region_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='样地表';

-- ============================================================
-- 5. model — AI模型元数据表
-- ============================================================
CREATE TABLE model (
    model_id     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '模型ID',
    model_name   VARCHAR(100) NOT NULL COMMENT '模型名称',
    algorithm    VARCHAR(50)           DEFAULT NULL COMMENT '算法类型',
    train_date   DATE                  DEFAULT NULL COMMENT '训练日期',
    r_squared    DECIMAL(6,4)          DEFAULT NULL COMMENT 'R²决定系数',
    rmse         DECIMAL(10,4)         DEFAULT NULL COMMENT '均方根误差',
    feature_list JSON                  DEFAULT NULL COMMENT '特征列表(JSON)',
    description  TEXT                   COMMENT '模型描述',
    PRIMARY KEY (model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型元数据表';

-- ============================================================
-- 6. tree — 单木表
-- ============================================================
CREATE TABLE tree (
    tree_id      BIGINT      NOT NULL AUTO_INCREMENT COMMENT '单木ID',
    plot_id      BIGINT      NOT NULL COMMENT '所属样地ID',
    species_id   BIGINT      NOT NULL COMMENT '树种ID',
    tree_number  VARCHAR(50)          DEFAULT NULL COMMENT '样地内编号（可为字母+数字，如 T001）',
    dbh          DECIMAL(8,2)         DEFAULT NULL COMMENT '胸径(cm)',
    height       DECIMAL(8,2)         DEFAULT NULL COMMENT '树高(m)',
    age          INT                  DEFAULT NULL COMMENT '树龄(年)',
    health_status VARCHAR(20)         DEFAULT NULL COMMENT '健康状态',
    PRIMARY KEY (tree_id),
    KEY idx_plot_id (plot_id),
    KEY idx_species_id (species_id),
    CONSTRAINT fk_tree_plot FOREIGN KEY (plot_id) REFERENCES plot (plot_id) ON DELETE CASCADE,
    CONSTRAINT fk_tree_species FOREIGN KEY (species_id) REFERENCES species (species_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单木表';

-- ============================================================
-- 7. volume — 实测蓄积量表
-- ============================================================
CREATE TABLE volume (
    vol_id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '蓄积ID',
    tree_id         BIGINT       NOT NULL COMMENT '单木ID',
    measured_volume DECIMAL(12,4)         DEFAULT NULL COMMENT '实测蓄积量(m³)',
    measure_date    DATE                   DEFAULT NULL COMMENT '测量日期',
    PRIMARY KEY (vol_id),
    KEY idx_tree_id (tree_id),
    CONSTRAINT fk_volume_tree FOREIGN KEY (tree_id) REFERENCES tree (tree_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实测蓄积量表';

-- ============================================================
-- 8. ai_prediction — AI预测蓄积量表
-- ============================================================
CREATE TABLE ai_prediction (
    pred_id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '预测ID',
    plot_id          BIGINT       NOT NULL COMMENT '样地ID',
    model_id         BIGINT       NOT NULL COMMENT '模型ID',
    predicted_volume DECIMAL(12,4)         DEFAULT NULL COMMENT '预测蓄积量(m³)',
    confidence       DECIMAL(6,4)          DEFAULT NULL COMMENT '置信度',
    predict_time     DATETIME              DEFAULT CURRENT_TIMESTAMP COMMENT '预测时间',
    PRIMARY KEY (pred_id),
    KEY idx_pred_plot_id (plot_id),
    KEY idx_pred_model_id (model_id),
    CONSTRAINT fk_prediction_plot FOREIGN KEY (plot_id) REFERENCES plot (plot_id) ON DELETE CASCADE,
    CONSTRAINT fk_prediction_model FOREIGN KEY (model_id) REFERENCES model (model_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI预测蓄积量表';

-- ============================================================
-- 9. operation_log — 操作日志表
-- ============================================================
CREATE TABLE operation_log (
    log_id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    user_id        BIGINT                DEFAULT NULL COMMENT '操作用户ID',
    operation      VARCHAR(100)           DEFAULT NULL COMMENT '操作描述',
    operation_time DATETIME               DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    details        TEXT                    COMMENT '详细内容',
    PRIMARY KEY (log_id),
    KEY idx_user_id (user_id),
    KEY idx_operation_time (operation_time),
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';
