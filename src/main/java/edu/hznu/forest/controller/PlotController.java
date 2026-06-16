package edu.hznu.forest.controller;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageInfo;
import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.service.PlotService;
import edu.hznu.forest.service.TreeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletResponse;

@Slf4j
@RestController
@RequestMapping("/api/plots")
public class PlotController {

    private final PlotService plotService;
    private final TreeService treeService;
    private final edu.hznu.forest.mapper.PlotMapper plotMapper;

    public PlotController(PlotService plotService, TreeService treeService,
                          edu.hznu.forest.mapper.PlotMapper plotMapper) {
        this.plotService = plotService;
        this.treeService = treeService;
        this.plotMapper = plotMapper;
    }

    @GetMapping
    public Result<PageInfo<Plot>> findAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("查询样地列表 - page: {}, size: {}", page, size);
        Page<Plot> plots = plotService.findAll(page, size);
        return Result.success(new PageInfo<>(plots));
    }

    @GetMapping("/all")
    public Result<List<Plot>> findAllForMap() {
        log.info("查询样地全部数据（地图用）");
        return Result.success(plotService.findAllForMap());
    }

    @GetMapping("/export/csv")
    public void exportCsv(
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLng,
            @RequestParam(required = false) Double maxLat,
            HttpServletResponse response) throws Exception {

        log.info("导出CSV - regionId={}, bbox={},{},{},{}", regionId, minLng, minLat, maxLng, maxLat);
        List<Map<String, Object>> rows = plotMapper.exportData(regionId, minLng, minLat, maxLng, maxLat);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"forest-export.csv\"");
        var os = response.getOutputStream();
        java.io.OutputStreamWriter writer = new java.io.OutputStreamWriter(os, java.nio.charset.StandardCharsets.UTF_8);

        /* BOM for Excel */
        writer.write('\uFEFF');

        /* Header */
        writer.write("样地编号,区域名称,纬度,经度,海拔(m),面积(ha),调查年份,样地类型,描述,树木编号,树种,胸径(cm),树高(m),树龄,健康状况,实测蓄积量(m³)\r\n");

        /* Data rows */
        for (Map<String, Object> row : rows) {
            writer.write(csvEscape(row.get("plotCode")));          writer.write(',');
            writer.write(csvEscape(row.get("regionName")));        writer.write(',');
            writer.write(csvEscape(row.get("latitude")));          writer.write(',');
            writer.write(csvEscape(row.get("longitude")));         writer.write(',');
            writer.write(csvEscape(row.get("elevation")));         writer.write(',');
            writer.write(csvEscape(row.get("area")));              writer.write(',');
            writer.write(csvEscape(row.get("surveyYear")));        writer.write(',');
            writer.write(csvEscape(row.get("plotType")));          writer.write(',');
            writer.write(csvEscape(row.get("description")));       writer.write(',');
            writer.write(csvEscape(row.get("treeNumber")));        writer.write(',');
            writer.write(csvEscape(row.get("speciesName")));       writer.write(',');
            writer.write(csvEscape(row.get("dbh")));               writer.write(',');
            writer.write(csvEscape(row.get("height")));            writer.write(',');
            writer.write(csvEscape(row.get("age")));               writer.write(',');
            writer.write(csvEscape(row.get("healthStatus")));      writer.write(',');
            writer.write(csvEscape(row.get("measuredVolume")));    writer.write("\r\n");
        }

        writer.flush();
        os.flush();
    }

    private String csvEscape(Object val) {
        if (val == null) return "";
        String s = val.toString().replace("\"", "\"\"");
        /* 如果包含逗号、换行或引号，用双引号包裹 */
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s + "\"";
        }
        return s;
    }

    @GetMapping("/{id}")
    public Result<Plot> findById(@PathVariable Long id) {
        log.info("查询样地详情: id={}", id);
        return Result.success(plotService.findById(id));
    }

    @GetMapping("/{id}/trees")
    public Result<List<Tree>> findTrees(@PathVariable Long id) {
        log.info("查询样地树木: plotId={}", id);
        return Result.success(treeService.findByPlotId(id));
    }

    @PostMapping
    public Result<Plot> create(@RequestBody Plot plot) {
        log.info("创建样地: {}", plot.getPlotCode());
        return Result.success(plotService.create(plot));
    }

    @PostMapping("/batch")
    public Result<List<Plot>> batchCreate(@RequestBody List<Plot> plots) {
        log.info("批量导入样地: {} 个", plots.size());
        return Result.success(plotService.batchCreate(plots));
    }

    @PutMapping("/{id}")
    public Result<Plot> update(@PathVariable Long id, @RequestBody Plot plot) {
        log.info("更新样地: id={}, code={}", id, plot.getPlotCode());
        plot.setPlotId(id);
        return Result.success(plotService.update(plot));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除样地: id={}", id);
        plotService.delete(id);
        return Result.ok();
    }
}
