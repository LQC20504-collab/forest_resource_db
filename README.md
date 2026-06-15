# AI森林资源调查数据库

基于 Spring Boot 4 + MyBatis + MySQL 9 的森林资源调查数据库系统，集成 Flask AI 蓄积量预测服务。

## 功能模块

- **样地管理**：样地 CRUD、分页查询、批量导入
- **单木管理**：按样地增删改查、批量导入
- **蓄积量管理**：实测蓄积量录入与查询（saveOrUpdate）
- **AI预测**：调用 Flask 服务，基于二元材积公式预测蓄积量
- **分区统计**：按行政区划汇总样地数、树木数、蓄积量
- **用户认证**：JWT 登录/注册，BCrypt 密码加密

## 技术栈

| 层     | 技术                         |
|--------|------------------------------|
| 后端   | Spring Boot 4.0.7, MyBatis  |
| 数据库 | MySQL 9.5.0                 |
| AI     | Flask (Python 3)             |
| 前端   | 纯 HTML/CSS/JS, ECharts     |

## 项目结构

```
forest-resource-db/
├── flask-ai/                  # AI 预测微服务（Python Flask）
├── src/main/
│   ├── java/edu/hznu/forest/
│   │   ├── config/            # JWT、Security、CORS 配置
│   │   ├── controller/        # REST API 控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── entity/            # 实体类（9张表）
│   │   ├── mapper/            # MyBatis Mapper 接口
│   │   ├── service/           # 业务逻辑层
│   │   └── common/            # 通用工具和响应封装
│   ├── resources/
│   │   ├── mapper/            # MyBatis XML 映射文件
│   │   ├── static/            # 前端页面（HTML/CSS/JS）
│   │   ├── schema.sql         # 数据库 DDL
│   │   ├── data.sql           # 种子数据
│   │   ├── advanced.sql       # 存储过程、触发器、视图
│   │   └── application.yaml   # 应用配置
└── pom.xml
```

## 快速开始

### 1. 启动 MySQL 并执行脚本

```sql
source schema.sql;
source data.sql;
source advanced.sql;
```

### 2. 启动后端

```bash
mvn spring-boot:run
```

服务运行在 `http://localhost:8081`

### 3. 启动 AI 预测服务

```bash
cd flask-ai
pip install flask flask-cors
python app.py
```

Flask 运行在 `http://localhost:5000`

### 4. 访问前端

打开浏览器访问 `http://localhost:8081`

默认账号：`admin` / `user`，密码均为 `123456`

## 高级数据库对象

- **存储过程**：`sp_region_volume_summary(rid)` — 指定行政区汇总；`sp_all_regions_summary()` — 全部行政区汇总
- **触发器**：`trg_ai_prediction_after_insert` — AI 预测后自动记录操作日志
- **视图**：`v_region_stats` — 分区统计视图；`v_plot_summary` — 样地汇总视图
