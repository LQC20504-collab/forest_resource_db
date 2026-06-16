# AI森林资源调查数据库

基于 Spring Boot 4 + MyBatis + MySQL 9 的森林资源调查数据库系统，集成 Flask AI 蓄积量预测服务。

## 功能模块

- **用户认证**：JWT 登录/注册，BCrypt 密码加密，个人信息管理
- **样地管理**：样地 CRUD、分页查询、批量导入（唯一约束冲突自动跳过）
- **单木管理**：按样地增删改查、批量导入
- **蓄积量管理**：实测蓄积量录入与查询（saveOrUpdate 模式）
- **AI预测**：调用 Flask 服务，基于二元材积公式预测蓄积量，支持单样地/批量预测
- **地图交互**：Leaflet Draw 框选（多边形/圆形/矩形）筛选样地，联动 AI 预测
- **时序图表**：ECharts 折线图展示选中样地多年蓄积变化趋势（含面积渐变）
- **分区统计**：按行政区划汇总样地数、树木数、实测/预测蓄积量（柱状图 + 饼图）
- **操作日志**：触发器自动记录 AI 预测操作，支持按用户/全部查询审计日志

## 技术栈

| 层         | 技术                                            |
|------------|-------------------------------------------------|
| 后端       | Spring Boot 4.0.7, MyBatis, Spring Security, JWT |
| 数据库     | MySQL 9.5.0（含存储过程、触发器、视图）        |
| AI         | Flask (Python 3)，二元材积公式                  |
| 前端       | 纯 HTML/CSS/JS, ECharts 5, Leaflet 1.9.4 + Draw |

## 项目结构

```
forest-resource-db/
├── flask-ai/                  # AI 预测微服务（Python Flask）
│   └── app.py                 # 预测 REST API + /health 健康检查
├── src/main/
│   ├── java/edu/hznu/forest/
│   │   ├── config/            # JWT、Security、CORS 配置
│   │   ├── controller/        # REST API 控制器（6个）
│   │   ├── dto/               # 数据传输对象
│   │   ├── entity/            # 实体类（9张表）
│   │   ├── mapper/            # MyBatis Mapper 接口
│   │   ├── service/           # 业务逻辑层
│   │   └── common/            # 通用工具和响应封装
│   ├── resources/
│   │   ├── mapper/            # MyBatis XML 映射文件
│   │   ├── static/            # 前端页面
│   │   │   ├── login.html     # 登录页
│   │   │   ├── dashboard.html # 仪表盘（ECharts 柱状图 + 饼图）
│   │   │   ├── plots.html     # 样地管理页
│   │   │   ├── statistics.html# 分区统计页
│   │   │   ├── map.html       # 地图交互框选页（Leaflet Draw）
│   │   │   ├── js/            # 前端 JavaScript
│   │   │   └── css/           # 样式文件
│   │   ├── schema.sql         # 数据库 DDL
│   │   ├── data.sql           # 种子数据 + 历史蓄积数据（2020-2026）
│   │   ├── advanced.sql       # 存储过程、触发器、视图
│   │   └── application.yaml   # 应用配置
│   └── ...
└── pom.xml
```

## 快速开始

### 1. 启动 MySQL 并执行脚本

```sql
source schema.sql;      -- 建表
source data.sql;        -- 插入测试数据（1394棵单木、1382+85条蓄积记录）
source advanced.sql;    -- 创建存储过程、触发器、视图
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

Flask 运行在 `http://localhost:5000`，健康检查：`GET /health`

### 4. 访问前端

打开浏览器访问 `http://localhost:8081`，共 5 个页面：

| 页面 | 地址 | 功能 |
|------|------|------|
| 登录 | `/login.html` | JWT 登录/注册 |
| 仪表盘 | `/dashboard.html` | 区域对比柱状图、树种分布饼图 |
| 样地管理 | `/plots.html` | 样地 CRUD、分页、单木/蓄积 CRUD |
| 分区统计 | `/statistics.html` | 行政区划汇总统计 |
| 地图 | `/map.html` | Leaflet Draw 交互框选 + AI 预测联动 |

默认账号：`admin` / `user`，密码均为 `123456`

## 高级数据库对象

> 存储过程和视图均采用**两侧预聚合子查询**设计，避免多粒度 JOIN 笛卡尔积问题。

| 对象 | 名称 | 说明 |
|------|------|------|
| 存储过程 | `sp_region_volume_summary(rid)` | 指定行政区蓄积量汇总 |
| 存储过程 | `sp_all_regions_summary()` | 全部行政区蓄积量汇总 |
| 触发器 | `trg_ai_prediction_after_insert` | AI 预测后自动记录操作日志 |
| 视图 | `v_region_stats` | 分区统计视图（用于仪表盘） |
| 视图 | `v_plot_summary` | 样地汇总视图（用于样地列表） |

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录获取 JWT |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/plots` | 样地分页查询 |
| POST | `/api/plots` | 新增样地 |
| GET | `/api/plots/{id}` | 样地详情 |
| PUT | `/api/plots/{id}` | 修改样地 |
| DELETE | `/api/plots/{id}` | 删除样地（级联删除） |
| POST | `/api/plots/batch` | 批量导入样地 |
| GET | `/api/trees?plotId=` | 按样地查询单木 |
| POST | `/api/trees/batch` | 批量导入单木 |
| GET | `/api/volumes/plot/{plotId}` | 查询样地蓄积记录（含历史） |
| POST | `/api/ai-predictions/predict/{plotId}` | 单样地 AI 预测 |
| POST | `/api/ai-predictions/predict-all` | 批量预测所有样地 |
| GET | `/api/statistics/regions/{regionId}` | 调用存储过程获取分区统计 |
| GET | `/api/statistics/region-view` | 查询 `v_region_stats` 视图 |
| GET | `/api/operation-logs` | 查询操作日志 |
