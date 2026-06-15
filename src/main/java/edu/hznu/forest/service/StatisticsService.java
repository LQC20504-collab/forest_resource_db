package edu.hznu.forest.service;

import edu.hznu.forest.dto.DashboardDTO;
import edu.hznu.forest.dto.PlotSummaryDTO;
import edu.hznu.forest.dto.RegionStatsDTO;
import edu.hznu.forest.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class StatisticsService {

    private final RegionMapper regionMapper;
    private final StatisticsMapper statisticsMapper;

    public StatisticsService(RegionMapper regionMapper,
                             StatisticsMapper statisticsMapper) {
        this.regionMapper = regionMapper;
        this.statisticsMapper = statisticsMapper;
    }

    /**
     * 从 v_region_stats 视图查询指定行政区汇总
     */
    public RegionStatsDTO getRegionSummary(Long regionId) {
        log.info("统计区域汇总(视图): regionId={}", regionId);
        var region = regionMapper.findById(regionId);
        if (region == null) {
            log.warn("区域不存在: regionId={}", regionId);
            return null;
        }
        // 从视图数据中过滤
        var allStats = statisticsMapper.selectRegionStatsView();
        RegionStatsDTO dto = allStats.stream()
                .filter(s -> regionId.equals(s.getRegionId()))
                .findFirst()
                .orElse(null);
        if (dto == null) {
            return null;
        }
        BigDecimal measured = dto.getTotalMeasuredVolume() != null ? dto.getTotalMeasuredVolume() : BigDecimal.ZERO;
        BigDecimal predicted = dto.getTotalPredictedVolume() != null ? dto.getTotalPredictedVolume() : BigDecimal.ZERO;
        dto.setAvgError(measured.subtract(predicted));
        return dto;
    }

    /**
     * 从 v_region_stats 视图查询所有行政区汇总
     */
    public List<RegionStatsDTO> getAllRegionsSummary() {
        log.info("统计所有区域汇总(视图)");
        return statisticsMapper.selectRegionStatsView();
    }

    public List<RegionStatsDTO> getRegionComparison() {
        return getAllRegionsSummary();
    }

    /**
     * 构建仪表盘数据：视图 + 聚合查询，替代逐层 Java 循环
     */
    public DashboardDTO getDashboardData() {
        log.info("构建仪表盘数据");
        DashboardDTO dto = new DashboardDTO();

        // 区域对比 —— 来自 v_region_stats 视图
        List<RegionStatsDTO> regionStats = statisticsMapper.selectRegionStatsView();
        dto.setRegionComparison(regionStats);

        // 树种分布（按株数）—— 聚合查询
        List<Map<String, Object>> speciesDist = statisticsMapper.selectSpeciesDistribution();
        Map<String, Long> distMap = new LinkedHashMap<>();
        for (var row : speciesDist) {
            distMap.put((String) row.get("name"), ((Number) row.get("value")).longValue());
        }
        dto.setSpeciesDistribution(distMap);

        // 树种蓄积量分布（按实测蓄积量）
        List<Map<String, Object>> speciesVol = statisticsMapper.selectSpeciesVolumeDistribution();
        Map<String, BigDecimal> volMap = new LinkedHashMap<>();
        for (var row : speciesVol) {
            volMap.put((String) row.get("name"), new BigDecimal(row.get("value").toString()));
        }
        dto.setSpeciesVolume(volMap);

        // 总体统计 —— 从视图结果聚合
        int totalPlots = regionStats.stream().mapToInt(r -> r.getPlotCount() != null ? r.getPlotCount() : 0).sum();
        int totalTrees = regionStats.stream().mapToInt(r -> r.getTreeCount() != null ? r.getTreeCount() : 0).sum();
        BigDecimal totalVolume = regionStats.stream()
                .map(r -> r.getTotalMeasuredVolume() != null ? r.getTotalMeasuredVolume() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int regionCount = regionStats.size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlots", totalPlots);
        stats.put("totalTrees", totalTrees);
        stats.put("totalVolume", totalVolume);
        stats.put("regionCount", regionCount);
        dto.setTotalStats(stats);

        log.info("仪表盘数据构建完成: regionCount={}, totalPlots={}, totalTrees={}",
                regionCount, totalPlots, totalTrees);
        return dto;
    }

    public List<RegionStatsDTO> getRegionStatsFromView() {
        log.info("查询 v_region_stats 视图");
        return statisticsMapper.selectRegionStatsView();
    }

    public List<PlotSummaryDTO> getPlotSummaryFromView() {
        log.info("查询 v_plot_summary 视图");
        return statisticsMapper.selectPlotSummaryView();
    }
}
