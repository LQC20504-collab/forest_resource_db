# Learnings

## Task 15 — Core CRUD Services (PlotService + TreeService + VolumeService) (2026-06-11)

### ✅ COMPLETED
- **Files Created**:
  - `src/main/java/edu/hznu/forest/service/PlotService.java` — `findAll(page,size)`, `findById`, `findByRegionId`, `create`, `update`, `delete`
  - `src/main/java/edu/hznu/forest/service/TreeService.java` — `findByPlotId`, `findById`, `create`, `update`, `delete`
  - `src/main/java/edu/hznu/forest/service/VolumeService.java` — `findByPlotId`, `findByTreeId`, `create`, `update`, `delete`
  - `src/main/java/edu/hznu/forest/dto/PlotDTO.java` — plotCode, regionId, latitude, longitude, elevation, area, surveyYear, plotType, description
  - `src/main/java/edu/hznu/forest/dto/TreeDTO.java` — plotId, speciesId, treeNumber, dbh, height, age, healthStatus
  - `src/main/java/edu/hznu/forest/dto/VolumeDTO.java` — treeId, measuredVolume, measureDate

### Key Decisions
- DTOs are plain POJOs with explicit getters/setters (no Lombok) per spec — used for request parameter mapping
- VolumeMapper has no `findById(Long)` method, so VolumeService.update/delete check existence by `rows == 0` return value instead
- All services use constructor injection (`private final` + constructor)
- `@Transactional` on all mutating methods (create/update/delete)
- `findById` in PlotService/TreeService throws `BusinessException(404, "...")` on null
- `PageHelper.startPage(page, size)` called before `plotMapper.findAll()` for paginated queries
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (44 source files)

## Task 6 — JWT工具类 + Spring Security配置 (2026-06-11)

- JwtUtil uses jjwt 0.12.6 API with Jwts.builder().subject().issuedAt().expiration().signWith().compact() (new API, not the old setSubject() etc.)
- Keys.hmacShaKeyFor() requires at least 256-bit key; secret padded to 32 bytes if shorter
- Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload() is the 0.12.x parsing API
- SecurityConfig uses lambda DSL: .csrf(csrf -> csrf.disable()) — Spring Security 6+ style
- SecurityFilterChain bean replaces the old WebSecurityConfigurerAdapter
- JwtAuthFilter extends OncePerRequestFilter with jakarta.servlet (Spring Boot 4.x / Jakarta EE)
- Authentication set via UsernamePasswordAuthenticationToken with empty authorities list (no role-based auth)
- CORS configured to allow all origins with Authorization exposed header
- SessionCreationPolicy.STATELESS for JWT-based stateless API

## Task 1 — Entity实体类 Part 1 (User, Region, Plot, Species) (2026-06-11)

### ✅ COMPLETED
- **Files**: User.java, Region.java, Plot.java, Species.java under `edu.hznu.forest.entity`
- **Lombok**: All use @Data + @NoArgsConstructor + @AllArgsConstructor
- **Naming**: Camel case fields (e.g., `userId` ↔ DB `user_id`)
- **Types**: BigDecimal for decimal fields, LocalDateTime for timestamps
- **No JPA annotations**, pure POJOs
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (13 source files)

## Task 4 — data.sql种子数据脚本 (2026-06-11)

### ✅ COMPLETED
- **File**: `src/main/resources/data.sql`
- **Row counts**: user=2, region=5, species=5, plot=5, model=2, tree=25, volume=25, ai_prediction=5, operation_log=2
- **Volume formula**: `measured_volume = 0.000025 * dbh² * height` (from `0.00005 * dbh² * height * 0.5`)
- **AI predictions**: CatBoost model, ~10-13% overestimation bias simulated
- **Passwords**: BCrypt hashed (`$2a$10$...`)
- **Critical**: MySQL `--default-character-set=utf8mb4` flag required for Chinese character inserts
- **PowerShell**: Use `cmd /c 'mysql ... < file.sql'` pattern since PS doesn't support `<` input redirection

## Task 11 — Spring Security过滤器链 + UserDetailsService (2026-06-11)

### ✅ COMPLETED
- **Created**: `UserDetailsServiceImpl.java` — implements `UserDetailsService`, uses `UserMapper.findByUsername()` with constructor injection
- **SecurityConfig.java** (pre-existing, already complete): JwtAuthFilter registered before `UsernamePasswordAuthenticationFilter`, CSRF disabled, stateless session, CORS open, permit paths `/api/auth/**`, `/login.html`, `/css/**`, `/js/**`
- **JwtAuthFilter.java** (pre-existing, already complete): Extracts Bearer token, validates via `JwtUtil.validateToken()`, sets `UsernamePasswordAuthenticationToken` in SecurityContext
- **Fixed pre-existing issue**: Duplicate entity classes in typo directory `edu\hnzu\forest\entity\` (should be `edu\hznu\forest\entity\`) were removed — these caused 6 "duplicate class" compilation errors
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (26 source files)

## Task 11 — MyBatis Mapper Part 2 (Tree/Volume/AI_Prediction/Model/OperationLog)

### Created Files
- **Entities (Task 9 prerequisite)**: Tree.java, Volume.java, AIPrediction.java, Model.java, OperationLog.java
- **Mapper Interfaces + XML**: TreeMapper, VolumeMapper, AIPredictionMapper, ModelMapper, OperationLogMapper
- **Note**: Task 9 entities were not previously created, had to create them as well

### Key Decisions
- TreeMapper.xml uses LEFT JOIN species to include speciesName (via s.common_name AS speciesName)
- Added extra speciesName field (non-DB) to Tree entity for JOIN query result mapping
- All XML use explicit resultMap (not relying solely on map-underscore-to-camel-case)
- VolumeMapper.sumVolumeByRegion returns BigDecimal via COALESCE(SUM(...), 0)
- OperationLogMapper.findByTimeRange uses BETWEEN ... AND ... with ORDER BY operation_time DESC

### Compilation
- .\mvnw.cmd clean compile — BUILD SUCCESS (first attempt had stale target/class files interfering; clean resolved it)
- Lombok emits non-fatal sun.misc.Unsafe warnings on Java 25 but compiles fine

## Task 10 — MyBatis Mapper Part 1 (User/Region/Plot/Species) (2026-06-11)

### ✅ COMPLETED
- **4 Mapper Interfaces**: UserMapper.java, RegionMapper.java, PlotMapper.java, SpeciesMapper.java under `edu.hznu.forest.mapper`
- **4 XML Mappers**: UserMapper.xml, RegionMapper.xml, PlotMapper.xml, SpeciesMapper.xml under `src/main/resources/mapper/`
- **All use `@Mapper` annotation** (not `@Repository`)
- **XML namespace** = interface fully-qualified name
- **`type-aliases-package: edu.hznu.forest.entity`** configured in application.yaml — allows `resultType="User"` etc.

### Mapper Details
| Mapper | Methods | Notes |
|--------|---------|-------|
| UserMapper | findByUsername, insert | insert uses `useGeneratedKeys=true` for auto-increment userId |
| RegionMapper | findAll, findById, findByParentId, insert, update, delete | Region CRUD with parent-child lookup |
| PlotMapper | findAll, findById, findByRegionId, insert, update, delete | findAll uses PageHelper (intercepted automatically) |
| SpeciesMapper | findAll, findById, insert, update, delete | Standard CRUD |

### Key Decisions
- `map-underscore-to-camel-case=true` auto-maps DB columns to Java fields (e.g., `region_id` → `regionId`)
- `#{}` parameter syntax used everywhere (no string concatenation)
- XML-based SQL only (no annotation SQL)
- `useGeneratedKeys` + `keyProperty` on all inserts for auto-increment ID retrieval
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (26 source files, up from 28 due to resolved duplicates)

## Task 18 — StatisticsService 蓄积量分区汇总统计 (2026-06-11)

### ✅ COMPLETED
- **Files**: 
  - `src/main/java/edu/hznu/forest/dto/RegionStatsDTO.java` — 区域统计DTO（regionId, regionName, plotCount, treeCount, totalMeasuredVolume, totalPredictedVolume, avgError）
  - `src/main/java/edu/hznu/forest/dto/DashboardDTO.java` — 仪表盘聚合DTO（regionComparison, speciesDistribution, totalStats）
  - `src/main/java/edu/hznu/forest/service/StatisticsService.java` — 统计服务（getRegionSummary, getAllRegionsSummary, getRegionComparison, getDashboardData）

### Key Decisions
- Constructor injection for all 5 mappers (RegionMapper, PlotMapper, TreeMapper, VolumeMapper, SpeciesMapper)
- `getRegionSummary(Long regionId)`: manual aggregation via mapper calls (plot → tree → volume), returns null if region not found
- `getAllRegionsSummary()`: streams over all regions, maps each to summary, filters nulls
- `getRegionComparison()`: delegates to `getAllRegionsSummary()` (alias for clarity)
- `getDashboardData()`: aggregates 3 data sets — region comparison list, species distribution map (LinkedHashMap for order), total stats map (totalPlots, totalTrees, totalVolume, regionCount)
- Species distribution computed by iterating all regions → plots → trees, mapping speciesId to commonName via speciesNameMap
- Uses `BigDecimal.ZERO` for null-safe volume accumulation with ternary null check
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (44 source files)

## Task 21 — Supplementary Controllers (Region/Species/AIPrediction) (2026-06-11)

### ✅ COMPLETED
- **Files Created**:
  - `src/main/java/edu/hznu/forest/controller/RegionController.java` — `@RequestMapping("/api/regions")`
    - `GET /` → `findAll` → `Result.success`
    - `GET /{id}` → `findById` → `Result.success`
    - `GET /{id}/children` → `findByParentId` → `Result.success`
    - `POST /` → `create` → `Result.success`
    - `PUT /{id}` → `update` (sets regionId from path) → `Result.success`
    - `DELETE /{id}` → `delete` → `Result.ok()`
  - `src/main/java/edu/hznu/forest/controller/SpeciesController.java` — `@RequestMapping("/api/species")`
    - `GET /` → `findAll` → `Result.success`
    - `GET /{id}` → `findById` → `Result.success`
    - `POST /` → `create` → `Result.success`
    - `PUT /{id}` → `update` (sets speciesId from path) → `Result.success`
    - `DELETE /{id}` → `delete` → `Result.ok()`
  - `src/main/java/edu/hznu/forest/controller/AIPredictionController.java` — `@RequestMapping("/api/ai-predictions")`
    - `GET /plot/{plotId}` → `findByPlotId` → `Result.success`
    - `GET /model/{modelId}` → `findByModelId` → `Result.success`
    - `POST /predict/{plotId}` → `predictFromFlask` → `Result.success`
    - `POST /` → `create` → `Result.success`

### Key Decisions
- Follows exact same pattern as AuthController: `@RestController` + constructor injection + `Result<T>` return
- `RegionController` and `SpeciesController` set the ID from path in update: `region.setRegionId(id)` / `species.setSpeciesId(id)` before passing to service
- `AIPredictionController` keeps Flask invocation separate: `POST /predict/{plotId}` triggers `predictFromFlask()` which calls Flask service, `POST /` is for manual prediction insert
- All `DELETE` return `Result.ok()` (success with null data) per convention
- **Compile**: `mvnw clean compile` — BUILD SUCCESS (49 source files)

## F2 — Code Quality Review (2026-06-12)

### ✅ BUILD
- `.\mvnw.cmd clean compile` — **BUILD SUCCESS** (52 source files)
- Expected Lombok sun.misc.Unsafe warnings (non-fatal)
- Unchecked warning in FlaskClient.java (raw Map return type)

### ✅ TESTS
- `.\mvnw.cmd test` — **29/29 PASS** (0 failures, 0 errors, 0 skipped)
- Test classes: AIIntegrationTest(2), AuthIntegrationTest(2), AuthControllerTest(2), PlotControllerTest(2), StatisticsControllerTest(2), ForestResourceDbApplicationTests(1), PlotMapperTest(2), UserMapperTest(2), VolumeMapperTest(2), AuthServiceTest(5), PlotServiceTest(4), StatisticsServiceTest(3)

### ✅ CLEAN SCANS — No Issues Found
- Empty catch blocks: 0
- console.log: 0 (all console calls are console.error — proper error logging)
- Commented-out code: 0
- TODO/FIXME/HACK/XXX: 0
- @SuppressWarnings: 0
- System.out/err.print: 0
- printStackTrace: 0
- Unused imports: 0 (all imports referenced)
- Over-commented code (AI slop): 0 (minimal Javadoc, 8 `//` Chinese comment lines, all legitimate)

### ⚠️ MINOR ISSUES FOUND
1. **StatisticsService.java:87 — Dead code (no-op expression)**
   `long count = treeMapper.findByPlotId(null) == null ? 0 : 0;`
   - Ternary always evaluates to 0 regardless of condition
   - Variable `count` is assigned but never read
   - Calls mapper with `null` parameter unnecessarily
2. **StatisticsService.java:86-90 — Unused map initialization**
   First loop creates `speciesDist` LinkedHashMap with 0 entries, but it's never used — immediately replaced by `actualDist` at line 95. This is wasted computation.
3. **FlaskClient.java:29 — Unchecked type cast**
   `postForObject(url, req, Map.class)` returns raw Map — minor compiler warning.

### ✅ NO ISSUES — Patterns Checked
- Generic names (`data`/`result`/`temp`): Result.data is standard API wrapper field (acceptable); AIPredictionService.result is Flask response map (descriptive enough)
- AI slop indicators: No over-abstraction, no excessive comments, no unnecessary generics or factories
- File sizes: Max 121 lines (StatisticsService.java), all well under threshold
- `var` usage: 12 uses in StatisticsService.java only — appropriate for Java 25
- JS catch handlers: All 14 `.catch()` blocks have meaningful error handling (console.error + user-facing feedback)
- HTML: Well-structured, no issues

### VERDICT
**APPROVED** — Code quality is clean overall. Only 2 minor issues in StatisticsService.java (dead code, unused map) that are cosmetic/cleanup items, not blocking.

---

## F4. Scope Fidelity Check (2026-06-12)

### VERDICT: **APPROVE**

### Tasks Compliant: **33/33** ✅
### Contamination: **CLEAN** — no items found outside scope

---

### Wave 1 — Infrastructure (Tasks 1-7): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **1. pom.xml** | ✅ | spring-boot-starter-security ✓, jjwt 0.12.6 ✓, pagehelper (4.1.0 for SB4.x) ✓, validation ✓, H2 for tests ✓. No JPA/Redis/MongoDB ✓ |
| **2. application.yaml** | ✅ | datasource+HikariCP ✓, mybatis config ✓, jwt(secret+expiration) ✓, server.port=8080 ✓, pagehelper ✓, logging DEBUG ✓, ai.predict.url ✓ |
| **3. schema.sql** | ✅ | 9 tables InnoDB utf8mb4 ✓, all FK ON DELETE CASCADE ✓, all indexes ✓. No GIS/spatial ✓, no Image/RS_Data ✓ |
| **4. data.sql** | ✅ | user=2(BCrypt) ✓, region=5 ✓, species=5 ✓, plot=5 ✓, model=2 ✓, tree=25 ✓, volume=25 ✓, ai_prediction=5 ✓, operation_log=2 ✓ |
| **5. Result+Exception** | ✅ | Result(code,message,data)+factories ✓, GlobalExceptionHandler(400/403/500) ✓, BusinessException ✓ |
| **6. JWT+Security** | ✅ | JwtUtil(generate/validate/getUsername) ✓, SecurityConfig(csrf.disable, stateless, permit /api/auth/**) ✓, JwtAuthFilter(Bearer extraction) ✓ |
| **7. Build Verify** | ✅ | mvnw clean compile BUILD SUCCESS ✓ |

### Wave 2 — Data Model (Tasks 8-13): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **8. Entity Part 1** | ✅ | User, Region, Plot, Species ✓. All @Data+@NoArgsConstructor+@AllArgsConstructor ✓. No JPA ✓ |
| **9. Entity Part 2** | ✅ | Tree, Volume, Model, AIPrediction, OperationLog ✓. speciesName for JOIN ✓ |
| **10. Mapper Part 1** | ✅ | UserMapper(findByUsername,insert) ✓, RegionMapper(CRUD+parent) ✓, PlotMapper(CRUD+region) ✓, SpeciesMapper(CRUD) ✓. All @Mapper, XML-only ✓ |
| **11. Mapper Part 2** | ✅ | TreeMapper(CRUD+JOIN) ✓, VolumeMapper(CRUD+sumByRegion) ✓, AIPredictionMapper(CRUD) ✓, ModelMapper(CRUD) ✓, OperationLogMapper(timeRange+insert) ✓ |
| **12. Advanced SQL** | ✅ | 2 stored procedures ✓, 1 trigger ✓, 2 views ✓. No cursor procs ✓ |
| **13. Security Chain** | ✅ | UserDetailsServiceImpl ✓, JwtAuthFilter correctly ordered ✓. No role permissions ✓ |

### Wave 3 — Business Services (Tasks 14-18): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **14. AuthService** | ✅ | UserService(register+BCrypt) ✓, AuthService(login→JWT) ✓, Login/RegisterRequest DTOs ✓ |
| **15. Core CRUD Services** | ✅ | PlotService(page+CRUD+@Tx) ✓, TreeService(CRUD+@Tx) ✓, VolumeService(CRUD+@Tx) ✓. DTOs plain POJOs ✓ |
| **16. Supplementary Services** | ✅ | RegionService(CRUD+parent+@Tx) ✓, SpeciesService(CRUD) ✓, ModelService(CRUD) ✓ |
| **17. AI Prediction Service** | ✅ | AIPredictionService(CRUD+predictFromFlask) ✓, FlaskClient(RestTemplate) ✓, yaml config ✓ |
| **18. StatisticsService** | ✅ | getRegionSummary ✓, getAllRegionsSummary ✓, getRegionComparison ✓, getDashboardData ✓. RegionStatsDTO+DashboardDTO ✓ |

### Wave 4 — Controllers (Tasks 19-22): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **19. AuthController** | ✅ | POST /login + /register ✓. @Valid ✓. No refresh/logout ✓ |
| **20. Core CRUD Controllers** | ✅ | PlotController(6 endpoints) ✓, TreeController(5 endpoints) ✓, VolumeController(3: GET/plot, GET/id, POST) ✓ |
| **21. Supplementary Controllers** | ✅ | RegionController(6+children) ✓, SpeciesController(5) ✓, AIPredictionController(4: GET/plot, GET/model, POST/predict, POST) ✓ |
| **22. StatisticsController** | ✅ | GET /regions/{id}, GET /regions, GET /dashboard ✓. JWT auth ✓ |

### Wave 5 — AI + Frontend (Tasks 23-27): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **23. Flask AI** | ✅ | app.py(35 lines, ≤50) ✓, POST /predict ✓, formula+noise ✓. requirements.txt ✓. No ML libs ✓ |
| **24. Login Page** | ✅ | login.html(centered card, login/register toggle, JWT) ✓, style.css(design system) ✓. No frameworks ✓ |
| **25. Dashboard** | ✅ | dashboard.html+js: bar chart(measured vs predicted) ✓, pie chart(species) ✓, 4 stat cards ✓. ECharts CDN ✓ |
| **26. Plots CRUD Page** | ✅ | plots.html+js: table+pagination ✓, create/edit/detail/delete modals ✓, region filter ✓. No maps ✓ |
| **27. Statistics Page** | ✅ | statistics.html+js: region table ✓, summary cards ✓, filter ✓, AI prediction trigger ✓ |

### Wave 6 — Tests (Tasks 28-31): ✅ ALL COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **28. Service Unit Tests** | ✅ | AuthService(5) + PlotService(4) + StatisticsService(3) = **12 tests** (≥8). Mockito ✓ |
| **29. Controller Tests** | ✅ | AuthController(2) + PlotController(2) + StatisticsController(2) = **6 tests** (≥6). MockMvc ✓ |
| **30. Mapper Tests** | ✅ | UserMapper(2) + PlotMapper(2) + VolumeMapper(2) = **6 tests** (≥6). @MybatisTest+H2 ✓ |
| **31. Auth+AI Integration** | ✅ | AuthIntegration(2: fullFlow+invalidCreds) + AIIntegration(2: Flask success+unavailable) = **4 tests**. MockRestServiceServer ✓ |

### Wave 7 — Report (Tasks 32-33): ✅ COMPLIANT

| Task | Status | Notes |
|------|--------|-------|
| **32. Report Part 1** | ✅ | Abstract, Ch1(Introduction), Ch2(Requirements), Ch3(System Design with ER) ✓ |
| **33. Report Part 2** | ✅ | Ch4(Logical Design+3NF), Ch5(Physical Implementation), Ch6(Summary), References[1-5] ✓ |

---

### Scope Contamination Analysis: **CLEAN**

| Category | Result |
|----------|--------|
| GIS/map libraries | ❌ Not found |
| Real ML training (scikit-learn etc.) | ❌ Not found |
| Redis/message queue/cache | ❌ Not found |
| RBAC/role permissions | ❌ Not found (role is informational only) |
| File upload/download | ❌ Not found |
| Docker/CI/CD | ❌ Not found |
| WebSocket/realtime | ❌ Not found |
| Spring Data JPA | ❌ Not found |
| Flask >50 lines | 35 lines ✅ |
| Frontend >5 pages | 4 pages ✅ |
| Unplanned dependencies | None found |
| Files outside expected structure | None found |

### Project Structure Verification
| Directory | Expected | Actual | Verdict |
|-----------|----------|--------|---------|
| entity/ | 9 | 9 | ✅ |
| mapper/ (interfaces) | 9 | 9 | ✅ |
| resources/mapper/ (XML) | 9 | 9 | ✅ |
| service/ | — | 11 services | ✅ |
| controller/ | — | 8 controllers | ✅ |
| config/ | Security | 4 files | ✅ |
| common/ | 3 files | 3 files | ✅ |
| dto/ | — | 7 DTOs | ✅ |
| static/ | ~5 files | 8 files | ✅ |
| test/ | — | 11 test files | ✅ |
| flask-ai/ | 3 files | 3 files | ✅ |
