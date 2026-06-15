package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.dto.DashboardDTO;
import edu.hznu.forest.dto.PlotSummaryDTO;
import edu.hznu.forest.dto.RegionStatsDTO;
import edu.hznu.forest.service.StatisticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/regions/{regionId}")
    public Result<RegionStatsDTO> getRegionSummary(@PathVariable Long regionId) {
        log.info("查询区域统计: regionId={}", regionId);
        RegionStatsDTO dto = statisticsService.getRegionSummary(regionId);
        return Result.success(dto);
    }

    @GetMapping("/regions")
    public Result<List<RegionStatsDTO>> getAllRegionsSummary() {
        log.info("查询所有区域统计汇总");
        return Result.success(statisticsService.getAllRegionsSummary());
    }

    @GetMapping("/dashboard")
    public Result<DashboardDTO> getDashboard() {
        log.info("查询仪表盘数据");
        return Result.success(statisticsService.getDashboardData());
    }

    @GetMapping("/region-view")
    public Result<List<RegionStatsDTO>> getRegionStatsView() {
        log.info("查询 v_region_stats 视图");
        return Result.success(statisticsService.getRegionStatsFromView());
    }

    @GetMapping("/plot-summary-view")
    public Result<List<PlotSummaryDTO>> getPlotSummaryView() {
        log.info("查询 v_plot_summary 视图");
        return Result.success(statisticsService.getPlotSummaryFromView());
    }
}
