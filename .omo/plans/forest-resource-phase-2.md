# AI森林资源调查数据库 — Phase 2 完善计划

## TL;DR

> **核心目标**：在已完成的 Phase 1 基础上，补齐前端管理界面、高级数据库对象可视化、长时序监测和代码质量提升。

> **可交付物**：
> - 前端管理页面（行政区管理、树种管理、操作日志查看、模型目录）
> - 视图数据可视化页面
> - 批量导入功能的前端集成
> - AI 预测保留历史记录（支持长时序变化趋势）
> - 代码清理与质量提升

> **预估工作量**：中型 | **并行执行**：YES — 3 Waves | **关键路径**：后端API完善 → 前端页面 → AI预测历史保留

---

## 上下文

### 已完成内容
- Phase 1 已完成：9张数据表（3NF）、完整REST API、JWT认证、Flask AI预测、前端4页面、高级数据库对象、课程报告
- 项目已推送至 GitHub: https://github.com/LQC20504-collab/forest_resource_db

### 已知缺口
- 后端已有 Region/Species/Model/OperationLog 的完整 REST API，但前端只有样地和单木管理页面
- v_region_stats 和 v_plot_summary 视图已有 API 暴露，但前端未做专用展示
- AI 预测采用"先删后插"策略，历史预测记录被覆盖
- 批量导入后端已完成，但前端未做对应上传界面

---

## 工作目标

### 具体交付物
- `src/main/resources/static/admin-regions.html` — 行政区管理页面
- `src/main/resources/static/admin-species.html` — 树种管理页面
- `src/main/resources/static/operation-logs.html` — 操作日志查看页面
- `src/main/resources/static/models.html` — AI模型目录页面
- `src/main/resources/static/views.html` — 视图数据展示页面
- 现有前端页面（仪表盘/样地管理）增加批量导入功能入口
- AI预测逻辑改造（保留历史、增加预测时间序列查看）
- 代码质量清理

### 完成定义
- [ ] 所有新前端页面可正常访问、数据展示正确
- [ ] 批量导入功能可通过前端上传JSON完成
- [ ] AI预测保留多次预测历史，前端可查看变化趋势

---

## 执行策略

### Wave 1: 前端管理页面补齐（4 tasks, ALL PARALLEL）
- **1. 行政区管理页面** — 调用 `GET /api/regions` / `POST /api/regions` / `PUT /api/regions/{id}` / `DELETE /api/regions/{id}`，表格+表单CRUD
- **2. 树种管理页面** — 调用 `GET /api/species` / `POST /api/species` / `PUT /api/species/{id}` / `DELETE /api/species/{id}`
- **3. AI模型目录页面** — 调用 `GET /api/models`，展示模型名称/算法/R²/RMSE/特征列表
- **4. 操作日志查看页面** — 调用 `GET /api/operation-logs` / `GET /api/operation-logs/user/{userId}`，时间范围过滤

### Wave 2: 高级功能前端集成（3 tasks, MAX PARALLEL）
- **5. 视图数据展示页面** — 调用 `GET /api/statistics/region-view` 和 `GET /api/statistics/plot-summary-view`，ECharts 图表展示
- **6. 批量导入前端入口** — 在样地管理页面增加 JSON 文件上传/粘贴导入功能
- **7. 导航栏集成** — 所有新页面加入导航栏，统一页面风格

### Wave 3: AI预测与长时序支持（2 tasks, SEQUENTIAL）
- **8. AI预测保留历史** — 修改 `AIPredictionService.predictFromFlask()`，移除先删后插逻辑，改为每次预测新增记录
- **9. 预测趋势页面** — 前端展示单个样地的多次预测结果，ECharts折线图展示变化趋势

---

## Must Have（必须包含）
- ✅ 所有新页面复用现有 CSS 设计系统
- ✅ 所有 API 调用携带 JWT Token
- ✅ 与现有登录/会话状态无缝衔接

## Must NOT Have
- ❌ 不引入新的后端框架或依赖
- ❌ 不修改现有数据库表结构
- ❌ 不修改现有 REST API 的响应格式（保持 Result<T> 结构）
- ❌ 不超过现有前端页面风格范围
