# AI森林资源调查数据库 — 全栈项目计划

## TL;DR

> **核心目标**：构建一个基于Spring Boot 4 + MyBatis + MySQL的AI森林资源调查数据库系统，支持样地、树种、蓄积量、遥感估测值的完整CRUD管理，实现蓄积量分区汇总统计，并完成课程期末大作业报告（报告.md）。

> **可交付物**：
> - MySQL数据库（9张表 + 存储过程 + 触发器 + 视图 + 索引 + 种子数据）
> - Spring Boot后端（实体、Mapper、Service、Controller、JWT认证、统一响应、全局异常）
> - Python Flask AI预测模拟服务
> - HTML/CSS/JS前端（登录、仪表盘、样地管理、分区统计 4个页面）
> - 单元测试 + 集成测试
> - 完整填充的期末报告（报告.md）

> **预估工作量**：大型 | **并行执行**：YES — 7 Waves | **关键路径**：基础设施 → DB → Service → Controller → 前端 → 测试 → 报告

---

## 上下文

### 原始需求
用户需要完成"数据库原理与应用"课程期末大作业：构建一个AI森林资源调查数据库系统，能存储样地、树种、蓄积量、遥感估测值，支持蓄积量分区汇总，纯HTML/CSS/JS前端，JWT登录，Spring Boot调用Python Flask AI服务，并完成报告.md。

### 访谈摘要
**关键决策**：
- **数据库**：MySQL 9.5.0 (localhost:3306, root/1234, database: forest_resource)
- **技术栈**：Spring Boot 4.0.7 + Java 25 + MyBatis，纯HTML/CSS/JS前端
- **认证**：JWT（Spring Security + jjwt）
- **AI集成**：Spring Boot RestTemplate调用Python Flask模拟服务（简单公式，~30行）
- **地图**：不包含任何GIS/地图组件
- **测试**：Spring Boot Test + JUnit单元/集成测试 + Agent QA

**研究参考**：
- `deep-research-report.md` — 详细表结构（User, Region, Plot, Species, Tree, Volume, AI_Prediction, Model, OperationLog, Image）、ER图、存储过程/触发器设计 → **作为主要表设计参考**
- `deep-research-report0.md` — API设计、前端可视化建议、开发时间表 → **作为API和前端参考**

### Metis审查
**已识别的缺口（均已解决）**：
- pom.xml缺少Spring Security + jjwt依赖 → 添加至Wave 1
- 数据库设计尚未初始化 → 创建schema.sql + data.sql
- application.yaml完全空白 → 完整配置datasource/jwt/mybatis
- 缺少Result<T>统一响应封装 → 添加至Wave 1基础设施
- 缺少分页策略 → 使用MyBatis PageHelper
- JWT合同未定义 → Bearer token, 24h有效期, BCrypt
- Flask服务契约未定义 → 明确输入/输出格式
- 评分标准需求映射 → 每个评分项对应具体任务

---

## 工作目标

### 核心目标
构建一个基于Spring Boot 4 + MyBatis + MySQL的全栈森林资源调查数据库系统，能够存储和管理样地、树种、单木蓄积量、AI遥感估测值，支持按行政区/生态区进行蓄积量分区汇总统计，并提供完整的Web管理界面。

### 具体交付物
- `src/main/resources/schema.sql` + `data.sql` — 完整DDL/DML
- `src/main/java/edu/hznu/forest/entity/` — 9个实体类
- `src/main/java/edu/hznu/forest/mapper/` — MyBatis Mapper接口 + XML
- `src/main/java/edu/hznu/forest/service/` — 业务服务层
- `src/main/java/edu/hznu/forest/controller/` — REST控制器
- `src/main/java/edu/hznu/forest/config/` — Spring Security + JWT配置
- `src/main/java/edu/hznu/forest/common/` — Result<T> + 全局异常处理器
- `src/main/resources/static/` — 前端HTML/CSS/JS页面
- `src/main/resources/application.yaml` — 完整配置
- `flask-ai/app.py` + `requirements.txt` — Python AI模拟服务
- `src/test/java/edu/hznu/forest/` — 单元与集成测试
- `报告.md` — 完整填充的课程报告

### 完成定义
- [ ] `./mvnw clean test` 所有测试通过（0失败）
- [ ] Spring Boot启动成功并连接MySQL
- [ ] 所有REST API可正常响应（curl验证）
- [ ] 前端页面可正常访问并完成CRUD操作
- [ ] Flask AI服务可被Spring Boot调用并返回预测值
- [ ] 报告.md所有章节内容完整、格式规范

### Must Have（必须包含）
- ✅ 9张数据表：User, Region, Plot, Species, Tree, Volume, AI_Prediction, Model, OperationLog
- ✅ 存储过程：分区蓄积汇总(至少1个)
- ✅ 触发器：AI预测记录自动日志(至少1个)
- ✅ 视图：分区统计视图(至少1个)
- ✅ JWT登录认证（用户名+密码，BCrypt加密）
- ✅ 样地/树种/单木/蓄积量完整CRUD API
- ✅ 蓄积量分区汇总API（按行政区、按生态区）
- ✅ AI预测存储与查询API
- ✅ Spring Boot调用Flask获取预测
- ✅ 前端仪表盘（ECharts柱状图+饼图+统计表）
- ✅ 种子数据：≥3个样地，≥15棵树，≥2个行政区，≥3个树种
- ✅ 单元测试（Service层）+ 集成测试（Controller层）
- ✅ 完整填充的报告.md

### Must NOT Have（保护边界 — 来自Metis审查）
- ❌ 不使用任何地图/GIS库（Leaflet, OpenLayers, 百度地图, 高德地图）
- ❌ 不实现真实机器学习模型训练（Flask仅用简单公式模拟）
- ❌ 不引入Redis/消息队列/缓存层
- ❌ 不实现RBAC权限系统（仅简单JWT登录，role字段仅供信息标识）
- ❌ 不实现文件上传/下载（CSV/Excel/GeoJSON导入导出）
- ❌ 不引入Docker/Kubernetes/CI/CD
- ❌ 不实现WebSocket/实时推送
- ❌ 不使用Spring Data JPA（项目已选MyBatis）
- ❌ Flask服务不超过50行
- ❌ 前端页面不超过5个（登录、仪表盘、样地管理、分区统计、详情）

---

## 验证策略

> **零人工干预** — 所有验证均通过自动化命令执行。

### 测试决策
- **基础设施存在**：YES（Spring Boot Test + JUnit已配置）
- **自动化测试**：YES（TDD方式，先写测试再实现）
- **框架**：JUnit 5 + Spring Boot Test + MyBatis Test
- **TDD工作流**：每个Service任务遵循 RED（失败测试）→ GREEN（最小实现）→ REFACTOR

### QA策略
每个任务包含Agent执行的QA场景。证据保存至 `.omo/evidence/task-{N}-{scenario-slug}.{ext}`。

- **前端/UI**：使用Playwright — 导航、交互、断言DOM、截图
- **API**：使用Bash (curl) — 发送请求、断言状态码与响应字段
- **数据库**：使用Bash (mysql) — 执行SQL、验证数据

---

## 执行策略

### 并行执行波形

```
Wave 1: 基础设施层（7 tasks, ALL PARALLEL）
├── 1. pom.xml依赖补全 [quick]
├── 2. application.yaml完整配置 [quick]
├── 3. schema.sql数据库建表脚本 [quick]
├── 4. data.sql种子数据脚本 [quick]
├── 5. Result<T>统一响应 + 全局异常处理器 [quick]
├── 6. JWT工具类 + Spring Security配置 [unspecified-high]
└── 7. 构建验证 + MySQL连接验证 [quick]

Wave 2: 数据模型层（6 tasks, MAX PARALLEL）
├── 8. Entity实体类 Part 1 [quick]
├── 9. Entity实体类 Part 2 [quick]
├── 10. MyBatis Mapper Part 1 [unspecified-high]
├── 11. MyBatis Mapper Part 2 [unspecified-high]
├── 12. 高级数据库对象（存储过程/触发器/视图） [deep]
└── 13. Spring Security过滤器链 + 认证配置 [unspecified-high]

Wave 3: 业务服务层（5 tasks, MAX PARALLEL）
├── 14. UserService + AuthService [quick]
├── 15. Core CRUD Services (Plot/Tree/Volume) [unspecified-high]
├── 16. Supplementary Services (Region/Species/Model) [quick]
├── 17. AI Prediction Service + Flask客户端 [unspecified-high]
└── 18. StatisticsService（分区蓄积汇总） [deep]

Wave 4: 控制器层（4 tasks, MAX PARALLEL）
├── 19. AuthController [quick]
├── 20. Core CRUD Controllers (Plot/Tree/Volume) [unspecified-high]
├── 21. Supplementary Controllers (Region/Species/AI_Prediction) [quick]
└── 22. StatisticsController [quick]

Wave 5: AI + 前端（5 tasks, MAX PARALLEL）
├── 23. Flask AI预测模拟服务 [quick]
├── 24. 登录/注册页面 [visual-engineering]
├── 25. 仪表盘页面（ECharts） [visual-engineering]
├── 26. 样地CRUD管理页面 [visual-engineering]
└── 27. 分区统计页面 [visual-engineering]

Wave 6: 测试层（4 tasks, MAX PARALLEL）
├── 28. Service层单元测试 [unspecified-high]
├── 29. Controller集成测试 [unspecified-high]
├── 30. MyBatis Mapper测试 [unspecified-high]
└── 31. Auth + AI集成测试 [unspecified-high]

Wave 7: 报告（2 tasks, parallel）
├── 32. 报告.md Part 1（第1-3章） [writing]
└── 33. 报告.md Part 2（第4-6章 + 参考文献） [writing]

Wave FINAL: 终极验证（4 tasks, PARALLEL）
├── F1. Plan Compliance Audit [oracle]
├── F2. Code Quality Review [unspecified-high]
├── F3. Real Manual QA [unspecified-high]
└── F4. Scope Fidelity Check [deep]
```

**关键路径**: 1 → 8 → 14 → 19 → 28 → F1-F4 → 用户确认
**并行加速比**: ~65% 比全顺序执行快

### Agent调度摘要

- **Wave 1**: 7 — T1-T5, T7 → `quick`, T6 → `unspecified-high`
- **Wave 2**: 6 — T8-T9 → `quick`, T10-T11 → `unspecified-high`, T12 → `deep`, T13 → `unspecified-high`
- **Wave 3**: 5 — T14, T16 → `quick`, T15, T17 → `unspecified-high`, T18 → `deep`
- **Wave 4**: 4 — T19, T21, T22 → `quick`, T20 → `unspecified-high`
- **Wave 5**: 5 — T23 → `quick`, T24-T27 → `visual-engineering`
- **Wave 6**: 4 — T28-T31 → `unspecified-high`
- **Wave 7**: 2 — T32-T33 → `writing`
- **Wave FINAL**: 4 — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

### Wave 1 — 基础设施层（全部可并行，立即启动）

- [x] 1. pom.xml依赖补全 — 添加Spring Security + JWT + 分页 + 验证依赖

  **What to do**：
  - 在pom.xml的`<dependencies>`中添加缺少的依赖：
    - `spring-boot-starter-security`
    - `jjwt-api`, `jjwt-impl`, `jjwt-jackson`（版本0.12.6）
    - `pagehelper-spring-boot-starter`（MyBatis分页插件, 版本2.1.5）
    - `spring-boot-starter-validation`（Bean Validation, Jakarta）
    - `spring-boot-starter-test`（测试支持）
  - 保留现有的：spring-boot-starter-webmvc, mybatis-spring-boot-starter, mysql-connector-j, lombok, spring-boot-starter-webmvc-test, mybatis-spring-boot-starter-test
  - 运行 `./mvnw clean compile` 验证依赖解析成功（Java 25 + Spring Boot 4.0.7兼容性）

  **Must NOT do**：
  - 不要删除任何已有依赖
  - 不要添加Spring Data JPA依赖
  - 不要添加Redis/MongoDB依赖
  - 不要修改parent版本号

  **Recommended Agent Profile**：
  - **Category**: `quick` — 仅修改pom.xml单文件，无复杂逻辑
  - **Skills**: 无特殊技能需求

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（可与任务2-7并行）
  - **Blocks**: 所有后续任务
  - **Blocked By**: 无

  **References**：
  - `pom.xml` — 当前依赖列表，需在此基础上追加
  - `https://github.com/jwtk/jjwt#maven` — jjwt Maven坐标最新版本
  - `https://github.com/pagehelper/Mybatis-PageHelper` — PageHelper Spring Boot starter

  **Acceptance Criteria**：
  - [ ] pom.xml包含spring-boot-starter-security依赖
  - [ ] pom.xml包含jjwt-api, jjwt-impl, jjwt-jackson（三件套）
  - [ ] pom.xml包含pagehelper-spring-boot-starter
  - [ ] pom.xml包含spring-boot-starter-validation
  - [ ] `./mvnw clean compile` 执行成功（BUILD SUCCESS）

  **QA Scenarios**：
  ```
  Scenario: Maven编译通过，所有依赖正确解析
    Tool: Bash (powershell)
    Preconditions: pom.xml已修改
    Steps:
      1. cd D:\Code\forest-resource-db
      2. .\mvnw.cmd clean compile
      3. 检查输出末尾是否包含 "BUILD SUCCESS"
    Expected Result: BUILD SUCCESS，无依赖解析错误
    Failure Indicators: 任何"Could not resolve dependencies"或编译错误
    Evidence: .omo/evidence/task-1-maven-build.txt
  ```

  **Commit**: YES
  - Message: `chore(pom): add Spring Security, JWT, PageHelper, Validation dependencies`
  - Files: `pom.xml`
  - Pre-commit: `.\mvnw.cmd clean compile`

---

- [x] 2. application.yaml完整配置 — 数据源 + MyBatis + JWT + 服务器

  **What to do**：
  - 配置spring.datasource连接MySQL 9.5.0:
    ```yaml
    url: jdbc:mysql://localhost:3306/forest_resource?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4&allowPublicKeyRetrieval=true
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
    ```
  - 配置HikariCP连接池：maximum-pool-size=20, minimum-idle=5
  - 配置mybatis：mapper-locations=classpath:mapper/*.xml, type-aliases-package=edu.hznu.forest.entity, configuration.map-underscore-to-camel-case=true
  - 配置jwt：secret（至少32字符）, expiration=86400000（24小时）
  - 配置server.port=8080
  - 配置pagehelper：helper-dialect=mysql, reasonable=true, support-methods-arguments=true
  - 启用SQL日志：logging.level.edu.hznu.forest.mapper=DEBUG

  **Must NOT do**：
  - 不要在yaml中硬编码数据库密码（本次项目允许，因为是本地开发）
  - 不要配置多数据源
  - 不要启用SSL for MySQL

  **Recommended Agent Profile**：
  - **Category**: `quick` — 单一配置文件修改

  **Parallelization**：
  - **Can Run In Parallel**: YES（与1、3-7并行）
  - **Blocks**: 所有需要连接数据库的任务

  **Acceptance Criteria**：
  - [ ] application.yaml包含完整datasource配置
  - [ ] application.yaml包含mybatis mapper-locations和type-aliases配置
  - [ ] application.yaml包含jwt.secret和jwt.expiration
  - [ ] Spring Boot启动后日志显示"HikariPool-1 - Starting..."（连接池启动）

  **QA Scenarios**：
  ```
  Scenario: Spring Boot启动连接MySQL成功
    Tool: Bash (powershell)
    Preconditions: MySQL 9.5.0正在运行，forest_resource数据库已存在
    Steps:
      1. cd D:\Code\forest-resource-db
      2. .\mvnw.cmd spring-boot:run
      3. 观察日志，等待"Started ForestResourceDbApplication"
      4. 检查日志中是否有"HikariPool-1 - Start completed"
    Expected Result: 应用启动成功，HikariCP连接池初始化完成
    Failure Indicators: "Communications link failure" 或 "Access denied for user"
    Evidence: .omo/evidence/task-2-startup-log.txt
  ```

  **Commit**: YES（与任务1合并提交）
  - Message: `chore(config): complete application.yaml with datasource, mybatis, jwt settings`
  - Files: `src/main/resources/application.yaml`

---

- [x] 3. schema.sql数据库建表脚本 — 9张表完整DDL

  **What to do**：
  - 创建 `src/main/resources/schema.sql`，参考 `deep-research-report.md` 第5节表结构
  - 创建数据库：`CREATE DATABASE IF NOT EXISTS forest_resource DEFAULT CHARSET utf8mb4;`
  - 使用数据库：`USE forest_resource;`
  - 创建9张表（顺序遵循外键依赖）：
    1. `user` — user_id(PK), username(UNIQUE), password, role, real_name, phone, create_time
    2. `region` — region_id(PK), region_code(UNIQUE), name, parent_id(FK自关联), level
    3. `species` — species_id(PK), common_name, latin_name, wood_density, carbon_coefficient
    4. `plot` — plot_id(PK), plot_code(UNIQUE), region_id(FK), latitude, longitude, elevation, area, survey_year, plot_type, description
    5. `model` — model_id(PK), model_name, algorithm, train_date, r_squared, rmse, feature_list(JSON), description
    6. `tree` — tree_id(PK), plot_id(FK), species_id(FK), tree_number, dbh, height, age, health_status
    7. `volume` — vol_id(PK), tree_id(FK), measured_volume, measure_date
    8. `ai_prediction` — pred_id(PK), plot_id(FK), model_id(FK), predicted_volume, confidence, predict_time
    9. `operation_log` — log_id(PK), user_id(FK), operation, operation_time, details
  - 所有外键添加 `ON DELETE CASCADE`
  - 所有表引擎使用 `InnoDB`，字符集 `utf8mb4`
  - 添加索引：plot(region_id), tree(plot_id), tree(species_id), volume(tree_id), ai_prediction(plot_id), ai_prediction(model_id), operation_log(user_id), operation_log(operation_time)

  **Must NOT do**：
  - 不要创建GIS/空间字段（POINT, GEOMETRY等）
  - 不要创建Image/RS_Data表（scope精简为9表）
  - 不要超过9张表

  **Recommended Agent Profile**：
  - **Category**: `quick` — SQL DDL脚本

  **Parallelization**：
  - **Can Run In Parallel**: YES（与任务1-2、4-7并行）
  - **Blocks**: 数据库相关所有任务

  **Acceptance Criteria**：
  - [ ] schema.sql包含9张表的完整CREATE TABLE语句
  - [ ] 所有字段类型正确（INT, VARCHAR, DECIMAL, DATE, DATETIME, YEAR, TEXT, JSON）
  - [ ] 所有外键约束正确声明
  - [ ] 所有索引已声明
  - [ ] 在MySQL中执行 `source schema.sql` 成功创建9张表

  **QA Scenarios**：
  ```
  Scenario: schema.sql在MySQL中执行成功
    Tool: Bash (powershell)
    Preconditions: MySQL 9.5.0正在运行
    Steps:
      1. cd D:\Code\forest-resource-db
      2. mysql -u root -p1234 < src\main\resources\schema.sql
      3. mysql -u root -p1234 -e "USE forest_resource; SHOW TABLES;"
      4. 断言输出包含9张表名
    Expected Result: SHOW TABLES输出9行，包含user, region, species, plot, model, tree, volume, ai_prediction, operation_log
    Failure Indicators: 任何SQL语法错误
    Evidence: .omo/evidence/task-3-show-tables.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add complete schema.sql with 9 tables, indexes, foreign keys`
  - Files: `src/main/resources/schema.sql`

---

- [x] 4. data.sql种子数据脚本 — 满足评分标准测试数据集要求

  **What to do**：
  - 创建 `src/main/resources/data.sql`
  - 种子数据量（满足评分标准"测试数据集完整"）：
    - `user`: 2条（admin/admin123, user/user123 — BCrypt加密密码）
    - `region`: 5条（浙江省、杭州市、西湖区、余杭区、临安区 — 支持层级分区）
    - `species`: 5条（马尾松、杉木、毛竹、栎类、其他硬阔）
    - `plot`: 5个样地（分布在不同行政区，面积0.04-0.10公顷）
    - `model`: 2条（随机森林模型v1, CatBoost模型v1）
    - `tree`: 25条（每样地5棵，不同树种、胸径、树高）
    - `volume`: 25条（对应每棵树的实测蓄积量，使用简单公式：0.00005 * dbh² * height * 0.5）
    - `ai_prediction`: 5条（每个样地1条AI预测值，使用模拟公式）
    - `operation_log`: 2条（初始管理员操作记录）
  - BCrypt密码：`admin123` → `$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi`
  - 密码：`user123` → `$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi`（简化用同一个hash，但password字段存明文或用标准BCrypt生成）

  **Must NOT do**：
  - 不要用明文存储密码
  - 不要少於3个行政区（分区汇总需要）

  **Recommended Agent Profile**：
  - **Category**: `quick` — SQL DML脚本

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocks**: 测试和前端演示

  **Acceptance Criteria**：
  - [ ] data.sql包含所有9张表的INSERT语句
  - [ ] `mysql -u root -p1234 < data.sql` 执行成功
  - [ ] 执行后 `SELECT COUNT(*) FROM tree` 返回 ≥25
  - [ ] 执行后 `SELECT COUNT(*) FROM plot` 返回 ≥5
  - [ ] 密码为BCrypt加密格式

  **QA Scenarios**：
  ```
  Scenario: 种子数据导入并验证行数
    Tool: Bash (powershell)
    Preconditions: schema.sql已执行
    Steps:
      1. mysql -u root -p1234 < src\main\resources\data.sql
      2. mysql -u root -p1234 -e "USE forest_resource; SELECT 'user', COUNT(*) FROM user UNION SELECT 'tree', COUNT(*) FROM tree UNION SELECT 'plot', COUNT(*) FROM plot UNION SELECT 'region', COUNT(*) FROM region UNION SELECT 'species', COUNT(*) FROM species;"
    Expected Result: user≥2, tree≥25, plot≥5, region≥5, species≥5
    Failure Indicators: 任何INSERT失败
    Evidence: .omo/evidence/task-4-data-counts.txt
  ```

  **Commit**: YES（与任务3合并）
  - Message: `feat(db): add seed data with 5 plots, 25 trees, 2 users`
  - Files: `src/main/resources/data.sql`

---

- [x] 5. Result<T>统一响应封装 + 全局异常处理器

  **What to do**：
  - 创建 `src/main/java/edu/hznu/forest/common/Result.java`：
    - 字段：`code`(Integer), `message`(String), `data`(T)
    - 静态工厂方法：`Result.success(T data)`, `Result.error(int code, String message)`
    - 常用快捷方法：`Result.ok()`, `Result.fail(String msg)`, `Result.unauthorized()`
  - 创建 `src/main/java/edu/hznu/forest/common/GlobalExceptionHandler.java`：
    - `@RestControllerAdvice` 注解
    - 处理 `MethodArgumentNotValidException` → 400 参数验证失败
    - 处理 `BindException` → 400 绑定失败
    - 处理 `AccessDeniedException` → 403 权限不足
    - 处理 `Exception` → 500 服务器内部错误
    - 所有响应统一用 `Result<T>` 格式
  - 创建 `src/main/java/edu/hznu/forest/common/BusinessException.java`：
    - 自定义运行时异常，携带code和message

  **Must NOT do**：
  - 不要创建复杂的错误码枚举（简单int即可）
  - 不要使用Spring默认的Whitelabel错误页面

  **Recommended Agent Profile**：
  - **Category**: `quick` — 3个简单工具类

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocks**: 所有Controller层（Wave 4）

  **Acceptance Criteria**：
  - [ ] Result.java包含泛型data字段和静态工厂方法
  - [ ] GlobalExceptionHandler能捕获并统一返回Result格式
  - [ ] BusinessException包含自定义code和message

  **QA Scenarios**：
  ```
  Scenario: 未映射路径返回统一JSON格式
    Tool: Bash (curl)
    Preconditions: 应用已启动
    Steps:
      1. curl -s http://localhost:8080/api/nonexistent
      2. 检查响应JSON结构
    Expected Result: {"code":404,...} 而非Whitelabel HTML页面
    Failure Indicators: 返回HTML格式错误页面
    Evidence: .omo/evidence/task-5-error-response.json
  ```

  **Commit**: YES
  - Message: `feat(common): add Result response wrapper and global exception handler`
  - Files: `src/main/java/edu/hznu/forest/common/Result.java`, `GlobalExceptionHandler.java`, `BusinessException.java`

---

- [x] 6. JWT工具类 + Spring Security配置

  **What to do**：
  - 创建 `src/main/java/edu/hznu/forest/config/JwtUtil.java`：
    - `generateToken(String username)` — 使用jjwt生成HS256签名token
    - `validateToken(String token)` — 验证token有效性
    - `getUsernameFromToken(String token)` — 从token提取username
    - `isTokenExpired(String token)` — 检查是否过期
    - 从application.yaml读取 `jwt.secret` 和 `jwt.expiration`
  - 创建 `src/main/java/edu/hznu/forest/config/SecurityConfig.java`：
    - `@Configuration` + `@EnableWebSecurity`
    - 配置SecurityFilterChain：放行 `/api/auth/**`，其他API需要认证
    - 配置PasswordEncoder Bean（BCryptPasswordEncoder）
    - 配置AuthenticationManager Bean
    - 禁用CSRF（API项目）
    - 禁用Session（无状态JWT）
  - 创建 `src/main/java/edu/hznu/forest/config/JwtAuthFilter.java`：
    - `OncePerRequestFilter` 子类
    - 从 `Authorization: Bearer <token>` 提取JWT
    - 验证token并设置SecurityContext

  **Must NOT do**：
  - 不要实现OAuth2/第三方登录
  - 不要实现角色权限过滤（认证即可，不授权）
  - 不要添加刷新token端点

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 涉及Spring Security配置，需要理解过滤器链

  **Parallelization**：
  - **Can Run In Parallel**: YES（与1-5、7并行）
  - **Blocks**: AuthController（任务14、19）

  **Acceptance Criteria**：
  - [ ] JwtUtil能正确生成和验证JWT token
  - [ ] SecurityConfig放行 `/api/auth/**`
  - [ ] JwtAuthFilter从请求头提取Bearer token并设置SecurityContext
  - [ ] 无token请求受保护端点返回401

  **QA Scenarios**：
  ```
  Scenario: 无token访问受保护API返回401
    Tool: Bash (curl)
    Preconditions: 应用启动
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/plots
    Expected Result: HTTP状态码为401或403
    Failure Indicators: 返回200（意味未受保护）
    Evidence: .omo/evidence/task-6-no-auth.txt
  ```

  **Commit**: YES
  - Message: `feat(security): add JWT utility and Spring Security filter chain`
  - Files: `src/main/java/edu/hznu/forest/config/JwtUtil.java`, `SecurityConfig.java`, `JwtAuthFilter.java`

---

- [x] 7. 构建验证 + MySQL连接验证

  **What to do**：
  - 验证所有Wave 1基础设施整合后能正确工作：
    1. 运行 `.\mvnw.cmd clean compile` — 确认编译通过
    2. 检查MySQL是否在运行：`mysql -u root -p1234 -e "SELECT VERSION();"`
    3. 创建数据库：`mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS forest_resource DEFAULT CHARSET utf8mb4;"`
    4. 执行schema.sql：`mysql -u root -p1234 forest_resource < src\main\resources\schema.sql`
    5. 执行data.sql：`mysql -u root -p1234 forest_resource < src\main\resources\data.sql`
    6. 验证数据：`mysql -u root -p1234 -e "USE forest_resource; SELECT COUNT(*) FROM tree;"`
    7. 尝试启动Spring Boot（后台运行然后kill）

  **Must NOT do**：
  - 不要在此任务中编写业务代码
  - 不要跳过验证步骤

  **Recommended Agent Profile**：
  - **Category**: `quick` — 验证类任务

  **Parallelization**：
  - **Can Run In Parallel**: 与任务1-6串行（需等它们完成）
  - **Blocks**: Wave 2（数据模型层）

  **Acceptance Criteria**：
  - [ ] Maven编译成功
  - [ ] MySQL连接成功
  - [ ] 9张表和种子数据成功创建
  - [ ] Spring Boot启动无致命错误

  **QA Scenarios**：
  ```
  Scenario: 端到端验证基础设施可用
    Tool: Bash (powershell)
    Preconditions: 任务1-6已完成
    Steps:
      1. cd D:\Code\forest-resource-db
      2. .\mvnw.cmd clean compile
      3. mysql -u root -p1234 -e "USE forest_resource; SELECT COUNT(*) AS tree_count FROM tree;"
    Expected Result: 编译BUILD SUCCESS，tree_count ≥ 25
    Evidence: .omo/evidence/task-7-verify.txt
  ```

  **Commit**: NO（验证任务，不产生新代码）

---

### Wave 2 — 数据模型层（全部可并行，依赖Wave 1）

- [x] 8. Entity实体类 Part 1 — User, Region, Plot, Species

  **What to do**：
  - 创建 `src/main/java/edu/hznu/forest/entity/` 包
  - **User.java**: user_id(Long), username, password, role, real_name, phone, create_time(LocalDateTime)
  - **Region.java**: region_id(Long), region_code, name, parent_id(Long), level(Integer)
  - **Plot.java**: plot_id(Long), plot_code, region_id(Long), latitude(BigDecimal), longitude(BigDecimal), elevation(BigDecimal), area(BigDecimal), survey_year(Integer), plot_type(String), description
  - **Species.java**: species_id(Long), common_name, latin_name, wood_density(BigDecimal), carbon_coefficient(BigDecimal)
  - 使用Lombok `@Data` + `@NoArgsConstructor` + `@AllArgsConstructor`

  **Must NOT do**：
  - 不要使用JPA注解（@Entity等）
  - 不要添加GIS/空间字段类型

  **Recommended Agent Profile**：
  - **Category**: `quick` — 纯POJO定义，无业务逻辑

  **Parallelization**：
  - **Can Run In Parallel**: YES（与任务9-13并行）
  - **Blocked By**: 任务7（基础设施验证）
  - **Blocks**: 任务10（Mapper层）

  **Acceptance Criteria**：
  - [ ] 4个实体类创建完成，字段名与数据库列名对应
  - [ ] 所有实体使用Lombok注解

  **Commit**: YES
  - Message: `feat(entity): add User, Region, Plot, Species entities`
  - Files: `src/main/java/edu/hznu/forest/entity/User.java`, `Region.java`, `Plot.java`, `Species.java`

---

- [x] 9. Entity实体类 Part 2 — Tree, Volume, AI_Prediction, Model, OperationLog

  **What to do**：
  - **Tree.java**: tree_id(Long), plot_id(Long), species_id(Long), tree_number(Integer), dbh(BigDecimal), height(BigDecimal), age(Integer), health_status(String)
  - **Volume.java**: vol_id(Long), tree_id(Long), measured_volume(BigDecimal), measure_date(LocalDate)
  - **Model.java**: model_id(Long), model_name, algorithm, train_date(LocalDate), r_squared(BigDecimal), rmse(BigDecimal), feature_list(String), description
  - **AI_Prediction.java**: pred_id(Long), plot_id(Long), model_id(Long), predicted_volume(BigDecimal), confidence(BigDecimal), predict_time(LocalDateTime)
  - **OperationLog.java**: log_id(Long), user_id(Long), operation, operation_time(LocalDateTime), details
  - 使用Lombok `@Data` + `@NoArgsConstructor` + `@AllArgsConstructor`

  **Must NOT do**：同任务8

  **Recommended Agent Profile**：
  - **Category**: `quick`

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务7
  - **Blocks**: 任务11

  **Acceptance Criteria**：
  - [ ] 5个实体类创建完成

  **Commit**: YES
  - Message: `feat(entity): add Tree, Volume, Model, AI_Prediction, OperationLog entities`
  - Files: `src/main/java/edu/hznu/forest/entity/Tree.java`, `Volume.java`, `Model.java`, `AI_Prediction.java`, `OperationLog.java`

---

- [x] 10. MyBatis Mapper Part 1 — User/Region/Plot/Species Mapper接口+XML

  **What to do**：
  - 创建 `src/main/resources/mapper/` 目录
  - **UserMapper.java + UserMapper.xml**: `findByUsername()`(登录), `insert()`(注册)
  - **RegionMapper.java + RegionMapper.xml**: `findAll()`, `findById()`, `findByParentId()`, `insert()`, `update()`, `delete()`
  - **PlotMapper.java + PlotMapper.xml**: `findAll()`(带PageHelper分页), `findById()`, `findByRegionId()`, `insert()`, `update()`, `delete()` — 使用resultMap映射关联
  - **SpeciesMapper.java + SpeciesMapper.xml**: `findAll()`, `findById()`, `insert()`, `update()`, `delete()`
  - XML中使用`#{}`防止SQL注入

  **Must NOT do**：
  - 不使用注解SQL（统一XML方式）
  - SQL中不拼接字符串

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 需要编写MyBatis XML

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务8（Entity Part 1）
  - **Blocks**: 任务14, 15

  **Acceptance Criteria**：
  - [ ] 4个Mapper接口+4个XML文件创建完成
  - [ ] `findByUsername`能正确查询用户表
  - [ ] PlotMapper使用PageHelper分页

  **Commit**: YES
  - Message: `feat(mapper): add User, Region, Plot, Species MyBatis mappers`
  - Files: UserMapper.java/xml, RegionMapper.java/xml, PlotMapper.java/xml, SpeciesMapper.java/xml

---

- [x] 11. MyBatis Mapper Part 2 — Tree/Volume/AI_Prediction/Model/OperationLog

  **What to do**：
  - **TreeMapper.java + TreeMapper.xml**: `findByPlotId()`, `findById()`, `insert()`, `update()`, `delete()` — JOIN species查树种名
  - **VolumeMapper.java + VolumeMapper.xml**: `findByTreeId()`, `findByPlotId()`(通过Tree联表), `insert()`, `update()`, `delete()`, `sumVolumeByRegion(Long regionId)` — 分区汇总
  - **AIPredictionMapper.java + AIPredictionMapper.xml**: `findByPlotId()`, `findByModelId()`, `insert()`, `update()`, `delete()`
  - **ModelMapper.java + ModelMapper.xml**: `findAll()`, `findById()`, `insert()`, `update()`, `delete()`
  - **OperationLogMapper.java + OperationLogMapper.xml**: `findByUserId()`, `findByTimeRange()`, `insert()`

  **Must NOT do**：同任务10

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high`

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务9（Entity Part 2）
  - **Blocks**: 任务15, 16, 17

  **Acceptance Criteria**：
  - [ ] TreeMapper.findByPlotId()返回该样地所有树木（含species名称）
  - [ ] VolumeMapper.sumVolumeByRegion()返回指定区域蓄积汇总数值>0
  - [ ] AIPredictionMapper.findByPlotId()返回该样地AI预测记录

  **Commit**: YES
  - Message: `feat(mapper): add Tree, Volume, AI_Prediction, Model, OperationLog mappers`
  - Files: TreeMapper.java/xml, VolumeMapper.java/xml, AIPredictionMapper.java/xml, ModelMapper.java/xml, OperationLogMapper.java/xml

---

- [x] 12. 高级数据库对象 — 存储过程 + 触发器 + 视图

  **What to do**：
  - 在 `src/main/resources/` 创建 `advanced.sql`（或追加到schema.sql末尾）
  - **存储过程 sp_region_volume_summary(IN rid BIGINT)**: 汇总指定行政区下所有样地的实测+预测蓄积量，返回region_name, total_measured, total_predicted, tree_count, plot_count
  - **存储过程 sp_all_regions_summary()**: 无参数，汇总所有行政区蓄积（供仪表盘图表使用）
  - **触发器 trg_ai_prediction_after_insert**: AFTER INSERT ON ai_prediction → 自动插入operation_log
  - **视图 v_region_stats**: JOIN region→plot→tree→volume→ai_prediction，输出分区统计
  - **视图 v_plot_summary**: 每个样地汇总统计

  **Must NOT do**：
  - 不创建游标类存储过程
  - 不创建级联触发器

  **Recommended Agent Profile**：
  - **Category**: `deep` — MySQL高级特性聚合SQL

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务3（schema.sql基础表）

  **Acceptance Criteria**：
  - [ ] `CALL sp_region_volume_summary(2)` 返回正确结果
  - [ ] 插入ai_prediction后operation_log自动新增记录
  - [ ] `SELECT * FROM v_region_stats` 展示正确分区统计

  **QA Scenarios**：
  ```
  Scenario: 存储过程返回分区蓄积汇总
    Tool: Bash (mysql)
    Preconditions: data.sql已执行
    Steps:
      1. mysql -u root -p1234 -e "USE forest_resource; CALL sp_region_volume_summary(2);"
    Expected Result: 返回指定区域的总蓄积量（数字>0）
    Evidence: .omo/evidence/task-12-sp-output.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add stored procedures, triggers, views for regional summary`
  - Files: `src/main/resources/advanced.sql`

---

- [x] 13. Spring Security过滤器链 + UserDetailsService

  **What to do**：
  - 完善 `SecurityConfig.java`：注册JwtAuthFilter到过滤器链，csrf.disable(), session无状态, CORS开放
  - 完善 `JwtAuthFilter.java`：从Authorization头提取token → 解析username → 加载UserDetails → 设置SecurityContext
  - 创建 `UserDetailsServiceImpl.java`（实现UserDetailsService）：通过UserMapper查询用户 → 构建Spring Security UserDetails

  **Must NOT do**：
  - 不添加角色权限过滤

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — Spring Security配置

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务6（JWT基础）+ 任务10（UserMapper）

  **Acceptance Criteria**：
  - [ ] JwtAuthFilter正确从Authorization头提取Bearer token
  - [ ] 无token请求受保护API返回401
  - [ ] UserDetailsServiceImpl通过用户名正确加载用户

  **Commit**: YES
  - Message: `feat(security): complete JWT filter chain and UserDetailsService`
  - Files: SecurityConfig.java, JwtAuthFilter.java, UserDetailsServiceImpl.java

---

### Wave 3 — 业务服务层（全部可并行，依赖Wave 2）

- [x] 14. UserService + AuthService

  **What to do**：
  - 创建 `src/main/java/edu/hznu/forest/service/UserService.java`：
    - `User register(String username, String password, String role)` — BCrypt加密密码 → 调用UserMapper.insert
    - `User findByUsername(String username)`
  - 创建 `src/main/java/edu/hznu/forest/service/AuthService.java`：
    - `Result<String> login(String username, String password)` — 查用户 → 验证BCrypt → JwtUtil生成token → 返回token
    - `Result<Void> register(String username, String password)` — 查重 → 调用UserService.register
  - 创建 `src/main/java/edu/hznu/forest/dto/LoginRequest.java` 和 `RegisterRequest.java`（含@NotBlank验证）

  **Must NOT do**：
  - 不返回refresh token，不实现密码修改/重置功能

  **Recommended Agent Profile**：
  - **Category**: `quick` — 简单业务逻辑

  **Parallelization**：
  - **Can Run In Parallel**: YES（与15-18并行）
  - **Blocked By**: 任务10（UserMapper）+ 任务6（JwtUtil）+ 任务13（SecurityConfig）
  - **Blocks**: 任务19（AuthController）

  **Acceptance Criteria**：
  - [ ] 登录成功返回JWT token字符串
  - [ ] 登录失败（密码错误/用户不存在）返回错误信息
  - [ ] 注册成功返回成功信息，重复用户名返回错误

  **QA Scenarios**：
  ```
  Scenario: 登录成功获取JWT token
    Tool: Bash (curl)
    Preconditions: data.sql已执行（admin/admin123）
    Steps:
      1. curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
    Expected Result: code=200, data包含有效JWT token（header.payload.signature三段格式）
    Failure Indicators: code!=200 或 data.token为空
    Evidence: .omo/evidence/task-14-login-success.json

  Scenario: 密码错误返回错误信息
    Tool: Bash (curl)
    Steps:
      1. curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"wrong\"}"
    Expected Result: code!=200, message包含"密码错误"或类似提示
    Evidence: .omo/evidence/task-14-login-fail.json
  ```

  **Commit**: YES
  - Message: `feat(service): add AuthService with JWT login/register`
  - Files: UserService.java, AuthService.java, LoginRequest.java, RegisterRequest.java

---

- [x] 15. Core CRUD Services — PlotService + TreeService + VolumeService

  **What to do**：
  - **PlotService.java**: CRUD全部方法（@Transactional）, `Page<Plot> findAll(int page, int size)`, `List<Plot> findByRegionId(Long)`, insert时验证region_id存在和plot_code唯一
  - **TreeService.java**: CRUD + `List<Tree> findByPlotId(Long)`
  - **VolumeService.java**: CRUD + `List<Volume> findByPlotId(Long)`（通过Tree联表），插入时验证tree_id存在
  - 创建DTO: PlotDTO, TreeDTO, VolumeDTO（用于请求参数映射）

  **Must NOT do**：
  - 不要在Service层直接操作HttpServletRequest/Response

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 多表关联业务逻辑

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务10, 11（Mapper层）
  - **Blocks**: 任务20（Controllers）

  **Acceptance Criteria**：
  - [ ] PlotService.findAll(1,3)返回正确分页数据
  - [ ] TreeService.findByPlotId()返回该样地所有树木
  - [ ] VolumeService.findByPlotId()通过Tree联表返回蓄积数据

  **Commit**: YES
  - Message: `feat(service): add PlotService, TreeService, VolumeService with CRUD`
  - Files: PlotService.java, TreeService.java, VolumeService.java + DTOs

---

- [x] 16. Supplementary Services — RegionService + SpeciesService + ModelService

  **What to do**：
  - **RegionService.java**: CRUD + `findByParentId(Long parentId)` — 支持层级查询
  - **SpeciesService.java**: 简单CRUD
  - **ModelService.java**: 简单CRUD（AI模型元数据管理）
  - 所有insert/@Transactional

  **Must NOT do**：标准CRUD即可

  **Recommended Agent Profile**：
  - **Category**: `quick` — 简单CRUD Service

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务10, 11
  - **Blocks**: 任务21

  **Acceptance Criteria**：
  - [ ] RegionService.findByParentId()返回子行政区列表
  - [ ] SpeciesService CRUD正常
  - [ ] ModelService CRUD正常

  **Commit**: YES
  - Message: `feat(service): add RegionService, SpeciesService, ModelService`
  - Files: RegionService.java, SpeciesService.java, ModelService.java

---

- [x] 17. AI Prediction Service + Flask REST客户端

  **What to do**：
  - **AIPredictionService.java**: CRUD + `AI_Prediction predictFromFlask(Long plotId)` — 调用Flask AI服务获取预测
  - **FlaskClient.java**: 使用RestTemplate POST到 `http://localhost:5000/predict`，请求体`{"plot_id": 1, "avg_dbh": 22.5, "avg_height": 18.3, "species_count": 3}`，响应体`{"predicted_volume": 125.6, "confidence": 0.85}`，从yaml读取`ai.predict.url`，连接失败抛BusinessException
  - 在application.yaml添加：`ai.predict.url=http://localhost:5000/predict`

  **Must NOT do**：
  - 不在Java中实现ML算法
  - Flask不可用时不要使整个请求崩溃

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 外部服务集成

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务11（AIPredictionMapper）+ 任务2
  - **Blocks**: 任务21, 23

  **Acceptance Criteria**：
  - [ ] predictFromFlask()能正确调用Flask服务并返回预测值
  - [ ] Flask不可用时返回明确的BusinessException错误信息

  **Commit**: YES
  - Message: `feat(service): add AIPredictionService and Flask REST client`
  - Files: AIPredictionService.java, FlaskClient.java, application.yaml（更新）

---

- [x] 18. StatisticsService — 蓄积量分区汇总

  **What to do**：
  - **StatisticsService.java**: `RegionStatsDTO getRegionSummary(Long)`, `List<RegionStatsDTO> getAllRegionsSummary()`, `List<RegionStatsDTO> getRegionComparison()`, `Map<String,Object> getDashboardData()`（聚合区域对比+树种分布+总体统计）
  - **RegionStatsDTO.java**: region_name, plot_count, tree_count, total_measured_volume, total_predicted_volume, avg_error
  - **DashboardDTO.java**: region_comparison, species_distribution, total_stats

  **Must NOT do**：
  - 不在Service层直接拼接SQL

  **Recommended Agent Profile**：
  - **Category**: `deep` — 聚合统计逻辑

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务11（VolumeMapper）+ 任务12（存储过程）
  - **Blocks**: 任务22

  **Acceptance Criteria**：
  - [ ] getRegionSummary()返回指定区域蓄积汇总（实测+预测+误差均>0）
  - [ ] getAllRegionsSummary()返回所有区域统计列表
  - [ ] getDashboardData()聚合三类数据（区域对比+树种分布+总体统计）

  **Commit**: YES
  - Message: `feat(service): add StatisticsService for regional volume summary`
  - Files: StatisticsService.java, RegionStatsDTO.java, DashboardDTO.java

---

### Wave 4 — 控制器层（全部可并行，依赖Wave 3）

- [x] 19. AuthController — 登录/注册REST API

  **What to do**：
  - 创建 `src/main/java/edu/hznu/forest/controller/AuthController.java`：
    - `POST /api/auth/login` — `@RequestBody @Valid LoginRequest` → AuthService.login → 返回Result<String>
    - `POST /api/auth/register` — `@RequestBody @Valid RegisterRequest` → AuthService.register → 返回Result<Void>
  - 使用 `@RestController` + `@RequestMapping("/api/auth")`

  **Must NOT do**：
  - 不添加refresh token端点
  - 不添加注销端点（前端清除localStorage即可）

  **Recommended Agent Profile**：
  - **Category**: `quick` — 2个端点

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务14（AuthService）
  - **Blocks**: 前端登录页面（任务24）

  **Acceptance Criteria**：
  - [ ] POST /api/auth/login 返回200 + JWT token
  - [ ] POST /api/auth/register 返回200
  - [ ] 无效请求体触发400 + 统一错误格式

  **QA Scenarios**：
  ```
  Scenario: 登录端点完整流程
    Tool: Bash (curl)
    Steps:
      1. curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
      2. curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"bad\"}"
    Expected Result: 第1次返回200+token，第2次返回401或400
    Evidence: .omo/evidence/task-19-auth.json
  ```

  **Commit**: YES
  - Message: `feat(controller): add AuthController with login/register endpoints`
  - Files: AuthController.java

---

- [x] 20. Core CRUD Controllers — PlotController + TreeController + VolumeController

  **What to do**：
  - **PlotController.java** (`@RequestMapping("/api/plots")`):
    - `GET /` — 分页列表（@RequestParam page, size）
    - `GET /{id}` — 详情
    - `GET /{id}/trees` — 该样地下所有树木
    - `POST /` — 新增
    - `PUT /{id}` — 更新
    - `DELETE /{id}` — 删除
  - **TreeController.java** (`@RequestMapping("/api/trees")`):
    - `GET /plot/{plotId}` — 按样地查树木
    - `GET /{id}` — 详情
    - `POST /` — 新增
    - `PUT /{id}` — 更新
    - `DELETE /{id}` — 删除
  - **VolumeController.java** (`@RequestMapping("/api/volumes")`):
    - `GET /plot/{plotId}` — 按样地查蓄积（通过Tree联表）
    - `GET /{id}` — 详情
    - `POST /` — 新增

  **Must NOT do**：
  - 不在Controller层写业务逻辑

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 5+端点，多表关联

  **Parallelization**：
  - **Can Run In Parallel**: YES（与19, 21, 22并行）
  - **Blocked By**: 任务15（Core Services）
  - **Blocks**: 前端页面（任务26）

  **QA Scenarios**：
  ```
  Scenario: 获取样地列表（含分页）
    Tool: Bash (curl)
    Steps:
      1. 登录获取token
      2. curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/plots?page=1&size=3
      3. 检查响应JSON的data.list数组长度
    Expected Result: 返回≤3个样地，data.total>=5
    Evidence: .omo/evidence/task-20-plot-list.json
  ```

  **Commit**: YES
  - Message: `feat(controller): add Plot/Tree/Volume REST controllers with CRUD`
  - Files: PlotController.java, TreeController.java, VolumeController.java

---

- [x] 21. Supplementary Controllers — RegionController + SpeciesController + AIPredictionController

  **What to do**：
  - **RegionController.java** (`/api/regions`): GET 全部/{id}/子区域, POST, PUT, DELETE
  - **SpeciesController.java** (`/api/species`): GET 全部/{id}, POST, PUT, DELETE
  - **AIPredictionController.java** (`/api/ai-predictions`):
    - `GET /plot/{plotId}` — 查某样地的AI预测
    - `POST /predict/{plotId}` — 调用Flask获取新预测并存储
    - `GET /model/{modelId}` — 按模型查预测

  **Must NOT do**：同任务20

  **Recommended Agent Profile**：
  - **Category**: `quick` — 标准CRUD Controller

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务16, 17

  **Acceptance Criteria**：
  - [ ] GET /api/regions 返回所有行政区列表
  - [ ] GET /api/species 返回所有树种列表
  - [ ] POST /api/ai-predictions/predict/{plotId} 返回AI预测结果

  **Commit**: YES
  - Message: `feat(controller): add Region/Species/AIPrediction REST controllers`
  - Files: RegionController.java, SpeciesController.java, AIPredictionController.java

---

- [x] 22. StatisticsController — 分区汇总 + 仪表盘数据

  **What to do**：
  - **StatisticsController.java** (`@RequestMapping("/api/statistics")`):
    - `GET /regions/{regionId}` — 单个区域蓄积汇总
    - `GET /regions` — 所有区域对比
    - `GET /dashboard` — 仪表盘聚合数据（区域对比+树种分布+总体统计）
  - 所有方法需JWT认证

  **Must NOT do**：
  - 不在Controller层做聚合计算

  **Recommended Agent Profile**：
  - **Category**: `quick` — 3个GET端点

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务18（StatisticsService）
  - **Blocks**: 前端仪表盘（任务25）

  **QA Scenarios**：
  ```
  Scenario: 仪表盘数据完整返回
    Tool: Bash (curl)
    Steps:
      1. 登录获取token
      2. curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/statistics/dashboard
      3. 检查响应JSON包含region_comparison, species_distribution, total_stats三个key
    Expected Result: 三个字段均有非空数据
    Evidence: .omo/evidence/task-22-dashboard.json
  ```

  **Commit**: YES
  - Message: `feat(controller): add StatisticsController for dashboard data`
  - Files: StatisticsController.java

---

### Wave 5 — Flask AI 服务 + 前端页面（全部可并行，依赖Wave 4）

- [x] 23. Flask AI预测模拟服务

  **What to do**：
  - 创建 `flask-ai/app.py`（总计不超过50行）：
    - Flask应用，`POST /predict` 端点
    - 接收JSON：`{"plot_id": 1, "avg_dbh": 22.5, "avg_height": 18.3, "species_count": 3}`
    - 使用简单模拟公式：`predicted_volume = 0.00005 * avg_dbh**2 * avg_height * species_count * 0.6`
    - 添加小量随机噪声：`random.uniform(-5, 5)` 模拟ML不完美性
    - 返回JSON：`{"predicted_volume": 125.6, "confidence": 0.85, "model": "simulated-model-v1"}`
  - 创建 `flask-ai/requirements.txt`：`flask`, `flask-cors`
  - Flask启用CORS（允许Spring Boot跨域调用）
  - 在 `flask-ai/readme.txt` 中写启动命令：`pip install -r requirements.txt && python app.py`

  **Must NOT do**：
  - 不要安装scikit-learn/tensorflow/pytorch
  - 不要超过50行代码
  - 不要从文件读取真实训练数据

  **Recommended Agent Profile**：
  - **Category**: `quick` — 极简Flask服务

  **Parallelization**：
  - **Can Run In Parallel**: YES（与24-27并行）
  - **Blocked By**: 无（独立服务）
  - **Blocks**: 任务17的集成测试

  **QA Scenarios**：
  ```
  Scenario: Flask服务启动并返回预测
    Tool: Bash (curl)
    Steps:
      1. cd flask-ai && pip install -r requirements.txt && python app.py &
      2. 等待"Running on http://127.0.0.1:5000"
      3. curl -s -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d "{\"plot_id\":1,\"avg_dbh\":22.5,\"avg_height\":18.3,\"species_count\":3}"
    Expected Result: 返回JSON，predicted_volume为>0的数值，confidence在0.75-0.95之间
    Evidence: .omo/evidence/task-23-flask-response.json
  ```

  **Commit**: YES
  - Message: `feat(ai): add Flask mock AI prediction service`
  - Files: `flask-ai/app.py`, `flask-ai/requirements.txt`

---

- [x] 24. 登录/注册页面

  **What to do**：
  - 创建 `src/main/resources/static/login.html`：
    - 干净的居中登录卡片设计（CSS）
    - 用户名+密码输入框
    - "登录"按钮 + "注册"链接
    - 登录成功后：API调用 → 存储JWT到localStorage → 跳转dashboard.html
    - 登录失败：显示红色错误提示
    - 注册模式切换（同一页面toggle登录/注册表单）
  - 创建 `src/main/resources/static/css/style.css`：统一样式表（导航栏、卡片、表格、表单）

  **Must NOT do**：
  - 不使用任何前端框架（React/Vue/Angular）
  - 不引入CDN的CSS框架（Bootstrap等）；手写CSS保持简洁

  **Recommended Agent Profile**：
  - **Category**: `visual-engineering` — 前端UI页面

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务19（AuthController）

  **QA Scenarios**：
  ```
  Scenario: 登录页面成功跳转
    Tool: Playwright (browser automation)
    Preconditions: Spring Boot应用在localhost:8080运行
    Steps:
      1. 打开 http://localhost:8080/login.html
      2. 输入用户名"admin"，密码"admin123"
      3. 点击"登录"按钮
      4. 等待页面跳转
    Expected Result: 跳转至dashboard.html，localStorage中存储了token
    Failure Indicators: 停留在login.html或显示错误信息
    Evidence: .omo/evidence/task-24-login-screenshot.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add login/register page with JWT auth`
  - Files: `src/main/resources/static/login.html`, `css/style.css`

---

- [x] 25. 仪表盘页面（ECharts图表）

  **What to do**：
  - 创建 `src/main/resources/static/dashboard.html`：
    - 顶部导航栏（仪表盘 | 样地管理 | 分区统计 | 退出登录）
    - 调用 `GET /api/statistics/dashboard`（带Authorization头）
    - **ECharts柱状图**：各行政区实测vs预测蓄积量对比（双柱并排）
    - **ECharts饼图**：树种分布（各树种数量占比）
    - **统计卡片行**：总样地数、总树木数、总蓄积量、平均预测精度
    - 加载失败显示友好的错误提示
  - 在 `static/js/` 创建 `dashboard.js`
  - ECharts通过CDN引入

  **Must NOT do**：
  - 不超过4个图表组件
  - 不引入复杂的交互联动

  **Recommended Agent Profile**：
  - **Category**: `visual-engineering` — ECharts图表 + 数据可视化

  **Parallelization**：
  - **Can Run In Parallel**: YES（与24, 26, 27并行）
  - **Blocked By**: 任务22（StatisticsController）

  **QA Scenarios**：
  ```
  Scenario: 仪表盘加载并显示图表
    Tool: Playwright
    Preconditions: 已登录状态（token在localStorage）
    Steps:
      1. 打开 http://localhost:8080/dashboard.html
      2. 等待3秒图表渲染完成
      3. 截图整个页面
    Expected Result: 页面显示柱状图、饼图和统计卡片，无空白或错误
    Failure Indicators: 任何图表区域为空白或显示"加载失败"
    Evidence: .omo/evidence/task-25-dashboard-screenshot.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add dashboard page with ECharts visualization`
  - Files: `dashboard.html`, `js/dashboard.js`

---

- [x] 26. 样地CRUD管理页面

  **What to do**：
  - 创建 `src/main/resources/static/plots.html`：
    - 顶部导航栏
    - **列表区域**：表格展示样地（plot_code, region, area, survey_year, tree_count），分页器
    - **操作栏**：新建样地按钮 + 搜索/筛选（按区域）
    - **新建/编辑模态框**：表单含plot_code, region下拉, lat/lng, elevation, area, survey_year, plot_type, description
    - **详情链接**：点击样地→显示样地详情+树木列表
    - 所有API调用带JWT token
  - 创建 `static/js/plots.js`

  **Must NOT do**：
  - 不实现地图可视化

  **Recommended Agent Profile**：
  - **Category**: `visual-engineering` — 复杂的CRUD界面

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务20（PlotController）

  **QA Scenarios**：
  ```
  Scenario: 创建新样地
    Tool: Playwright
    Steps:
      1. 登录后打开 http://localhost:8080/plots.html
      2. 点击"新建样地"按钮
      3. 填写表单：plot_code="SAMPLE-06", region选择第3个, area=0.06, survey_year=2025
      4. 点击提交
    Expected Result: 表格中新增一行"SAMPLE-06"，关闭模态框
    Evidence: .omo/evidence/task-26-create-plot.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add plot CRUD management page`
  - Files: `plots.html`, `js/plots.js`

---

- [x] 27. 分区统计页面

  **What to do**：
  - 创建 `src/main/resources/static/statistics.html`：
    - 顶部导航栏
    - **区域对比表格**：行政区名、样地数、树木数、实测总蓄积、预测总蓄积、平均误差
    - 数据来源：`GET /api/statistics/regions`
    - **区域下拉筛选**：选择特定区域→显示该区域详情
    - **AI预测触发按钮**：对指定样地触发Flask预测（`POST /api/ai-predictions/predict/{plotId}`）
    - 创建 `static/js/statistics.js`

  **Must NOT do**：
  - 不超过1个表格+1个筛选器

  **Recommended Agent Profile**：
  - **Category**: `visual-engineering` — 数据展示页面

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务21, 22

  **QA Scenarios**：
  ```
  Scenario: 区域统计表格正确展示数据
    Tool: Playwright
    Steps:
      1. 登录后打开 http://localhost:8080/statistics.html
      2. 等待表格加载
    Expected Result: 表格显示至少3个区域的数据，每行含实测蓄积和预测蓄积
    Evidence: .omo/evidence/task-27-stats-table.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add regional statistics page`
  - Files: `statistics.html`, `js/statistics.js`

---

### Wave 6 — 测试层（全部可并行，依赖Wave 3-5）

- [x] 28. Service层单元测试

  **What to do**：
  - 创建测试类（使用JUnit 5 + Mockito）：
    - `AuthServiceTest.java`：测试 login成功/失败、register成功/重复用户名
    - `PlotServiceTest.java`：测试 findAll分页、findByRegionId、insert验证
    - `StatisticsServiceTest.java`：测试 getRegionSummary、getDashboardData mock数据验证
  - Mock所有Mapper依赖（@Mock + @InjectMocks）
  - 验证业务逻辑正确性而非数据库状态

  **Must NOT do**：
  - 不写集成测试（那是任务29的范围）
  - 不连接真实数据库

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — 需要Mockito和JUnit经验

  **Parallelization**：
  - **Can Run In Parallel**: YES（与29-31并行）
  - **Blocked By**: 任务14, 15, 18（Services）

  **Acceptance Criteria**：
  - [ ] 所有测试通过：`./mvnw test -Dtest=*ServiceTest`
  - [ ] 至少8个测试用例（login成功/失败、register成功/重复、findAll分页、getRegionSummary等）

  **QA Scenarios**：
  ```
  Scenario: 执行所有Service层测试
    Tool: Bash (powershell)
    Steps:
      1. .\mvnw.cmd test -Dtest="*ServiceTest"
    Expected Result: Tests run: >=8, Failures: 0
    Evidence: .omo/evidence/task-28-service-tests.txt
  ```

  **Commit**: YES
  - Message: `test(service): add unit tests for AuthService, PlotService, StatisticsService`
  - Files: AuthServiceTest.java, PlotServiceTest.java, StatisticsServiceTest.java

---

- [x] 29. Controller集成测试

  **What to do**：
  - 创建集成测试类（@SpringBootTest + @AutoConfigureMockMvc）：
    - `AuthControllerTest.java`：MockMvc测试 login成功(200+token)/失败(401)、register成功/重复
    - `PlotControllerTest.java`：测试 GET /api/plots分页、POST创建、GET {id}详情、DELETE
    - `StatisticsControllerTest.java`：测试 GET /api/statistics/dashboard返回完整数据
  - 使用MockMvc.perform()发送请求并断言状态码和JSON路径

  **Must NOT do**：
  - 不连接真实数据库（使用@Sql初始化测试数据或H2测试数据库，或mock Service）

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high` — Spring MockMvc集成测试

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务19, 20, 22（Controllers）

  **Acceptance Criteria**：
  - [ ] `./mvnw test -Dtest=*ControllerTest` 全部通过
  - [ ] 至少6个测试用例

  **Commit**: YES
  - Message: `test(controller): add integration tests for Auth, Plot, Statistics controllers`
  - Files: AuthControllerTest.java, PlotControllerTest.java, StatisticsControllerTest.java

---

- [x] 30. MyBatis Mapper测试

  **What to do**：
  - 创建 `UserMapperTest.java`：测试 findByUsername正确返回用户
  - 创建 `PlotMapperTest.java`：测试 findAll分页、findByRegionId
  - 创建 `VolumeMapperTest.java`：测试 sumVolumeByRegion分区汇总SQL
  - 使用 `@MybatisTest` 注解 + H2内存数据库（或使用@SpringBootTest连接真实MySQL测试数据库）
  - 测试SQL正确性和MyBatis映射正确性

  **Must NOT do**：
  - 不要测试每个Mapper的所有方法（聚焦核心查询）

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high`

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务10, 11（Mappers）

  **QA Scenarios**：
  ```
  Scenario: Mapper测试全部通过
    Tool: Bash
    Steps:
      1. .\mvnw.cmd test -Dtest="*MapperTest"
    Expected Result: Tests run >=6, Failures: 0
    Evidence: .omo/evidence/task-30-mapper-tests.txt
  ```

  **Commit**: YES
  - Message: `test(mapper): add MyBatis mapper tests for User, Plot, Volume`
  - Files: UserMapperTest.java, PlotMapperTest.java, VolumeMapperTest.java

---

- [x] 31. Auth + AI集成测试

  **What to do**：
  - `AuthIntegrationTest.java`：完整认证流程 → 登录获取token → 用token访问受保护API → 验证token过期行为
  - `AIIntegrationTest.java`：模拟Flask服务（使用WireMock或MockServer）→ 调用AIPredictionService.predictFromFlask → 验证RestTemplate请求和响应映射 → 验证Flask不可用时的降级行为
  - 使用@SpringBootTest真实启动应用测试

  **Must NOT do**：
  - 不依赖真实Flask服务运行

  **Recommended Agent Profile**：
  - **Category**: `unspecified-high`

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 任务14, 17, 19, 21

  **Acceptance Criteria**：
  - [ ] AuthIntegrationTest验证登录→token→访问受保护API完整流程
  - [ ] AIIntegrationTest验证Flask服务mock调用和降级行为
  - [ ] 所有集成测试通过：`./mvnw test -Dtest=*IntegrationTest`

  **Commit**: YES
  - Message: `test(integration): add auth flow and AI client integration tests`
  - Files: AuthIntegrationTest.java, AIIntegrationTest.java

---

### Wave 7 — 报告层（2 tasks，可并行）

- [x] 32. 报告.md Part 1 — 引言 + 需求分析 + 系统设计

  **What to do**：
  - 填充 `报告.md` 的前半部分章节：
    - **摘要**（替换XXXXXX）：概括项目背景（森林资源调查+AI遥感）、主要功能（9表+CRUD+分区汇总+AI预测）、技术创新点（Spring Boot全栈+JWT+Flask集成）
    - **1 引言**：森林资源调查的传统方法局限 → AI+遥感技术优势 → 本项目的目标和意义
    - **2 需求分析**：2.1系统目标（管理森林调查数据+支持分区汇总+集成AI预测），2.2功能需求（用户认证、样地管理、树木管理、蓄积量管理、AI预测、分区统计），2.3功能分析（功能模块图描述——可用文字描述或表格）
    - **3 系统设计**：3.1 E-R图（基于deep-research-report.md的Mermaid ER图，复制并说明），3.2设计说明（9张表的设计思路和分工），3.3业务流程设计（数据录入→AI预测→分区汇总的主流程描述）
    - 参考 `deep-research-report.md` 和 `deep-research-report0.md` 的内容

  **Must NOT do**：
  - 不伪造不存在的功能
  - 不超出9张表的范围

  **Recommended Agent Profile**：
  - **Category**: `writing` — 学术报告撰写

  **Parallelization**：
  - **Can Run In Parallel**: YES（与33并行）
  - **Blocked By**: 所有实现任务完成

  **Acceptance Criteria**：
  - [ ] 摘要、引言、需求分析、系统设计4个章节内容完整
  - [ ] E-R图使用Mermaid语法且与数据库实际结构一致
  - [ ] 格式符合报告规范（A4纸双面打印标准）

  **Commit**: YES
  - Message: `docs(report): fill chapters 1-3 (abstract, requirements, system design)`
  - Files: `报告.md`

---

- [x] 33. 报告.md Part 2 — 逻辑设计 + 物理实现 + 总结

  **What to do**：
  - 填充报告后续章节（使用实际代码和运行截图）：
    - **4 逻辑设计**：4.1表结构设计（9张表的字段、类型、约束说明），4.2范式分析（逐表分析满足3NF），4.3安全性与完整性设计（外键约束、NOT NULL、UNIQUE索引、JWT认证）
    - **5 物理设计与实现**：5.1数据库创建（schema.sql关键代码片段+运行截图），5.2索引与优化（4个核心索引说明+Explain分析），5.3基础功能实现（4个CRUD核心API的代码片段+curl测试截图），5.4高级功能实现（存储过程代码+触发器代码+视图代码+运行验证）
    - **6 总结**：开发过程回顾、技术难点（JWT集成、MyBatis联表、Flask集成、分区汇总SQL）、解决方案、心得体会、是否达预期、改进建议
    - **参考文献**：保留已有[1][2]，加入deep-research-report.md和deep-research-report0.md引用的文献

  **Must NOT do**：
  - 代码片段不要过长（每个不超过15行）
  - 不要使用不存在的截图路径

  **Recommended Agent Profile**：
  - **Category**: `writing` — 学术报告撰写

  **Parallelization**：
  - **Can Run In Parallel**: YES
  - **Blocked By**: 所有实现任务完成

  **Acceptance Criteria**：
  - [ ] 逻辑设计、物理实现、总结3个章节内容完整
  - [ ] 包含至少3处代码片段和2处运行截图说明
  - [ ] 3NF分析覆盖全部9张表
  - [ ] 参考文献≥5条

  **Commit**: YES
  - Message: `docs(report): fill chapters 4-6 (logical design, implementation, summary)`
  - Files: `报告.md`

---

## Final Verification Wave（所有实现任务完成后，4个审查并行）

> 全部4个审查必须APPROVE。汇总结果呈报用户，获取明确"okay"后方可标记完成。

- [x] F1. **Plan Compliance Audit** — `oracle` → **APPROVE** (MustHave 12/12, MustNOT 10/10, Tasks 33/33)
- [x] F2. **Code Quality Review** — `unspecified-high` → **APPROVE** (Build PASS, Tests 29/29, Files clean)
- [x] F3. **Real Manual QA** — `unspecified-high` → **APPROVE** (Login+JWT+CRUD+Stats+Dashboard+AIpredict+Edge cases: ALL PASS)
- [x] F4. **Scope Fidelity Check** — `deep` → **APPROVE** (Tasks 33/33 compliant, Contamination CLEAN)

---

## Commit Strategy

| Wave | 提交信息 | 关键文件 |
|:---|:---|:---|
| 1 | 基础设施：pom.xml + application.yaml + schema.sql + data.sql + common + security | pom.xml, application.yaml, schema.sql, data.sql |
| 2 | 数据模型：全部9个Entity + 全部Mapper XML + 存储过程/触发器 + Security配置 | entity/, mapper/, advanced.sql |
| 3 | 业务服务：所有Service + DTO + FlaskClient | service/, dto/ |
| 4 | REST控制器：所有Controller | controller/ |
| 5 | Flask AI + 前端：Flask服务 + 4个HTML页面 + JS + CSS | flask-ai/, static/ |
| 6 | 测试：单元测试 + 集成测试 + Mapper测试 | test/ |
| 7 | 报告：报告.md完整填充 | 报告.md |

---

## Success Criteria

### 验证命令

```bash
# 1. 编译 + 测试
.\mvnw.cmd clean test
# Expected: BUILD SUCCESS, all tests pass

# 2. 认证测试
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
# Expected: {"code":200,"data":"<JWT token>"}

# 3. 受保护资源
curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/plots?page=1&size=3
# Expected: {"code":200,"data":{"list":[...],"total":5}}

# 4. 分区汇总
curl -s -H "Authorization: Bearer <token>" http://localhost:8080/api/statistics/regions
# Expected: 返回至少2个区域的蓄积统计

# 5. Flask AI预测
curl -s -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d "{\"plot_id\":1,\"avg_dbh\":22.5,\"avg_height\":18.3,\"species_count\":3}"
# Expected: {"predicted_volume": ..., "confidence": ...}
```

### 最终检查清单
- [x] 所有 "Must Have" 均已实现
- [x] 所有 "Must NOT Have" 均已规避
- [x] `./mvnw clean test` 全部通过 (29/29 tests)
- [x] 报告.md 所有章节完整
- [x] F1-F4 全部审查通过
- [x] 用户明确确认 "okay"

