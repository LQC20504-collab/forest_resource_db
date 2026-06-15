package edu.hznu.forest.mapper;

import edu.hznu.forest.dto.PlotSummaryDTO;
import edu.hznu.forest.dto.RegionStatsDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface StatisticsMapper {

    List<RegionStatsDTO> selectRegionStatsView();

    List<PlotSummaryDTO> selectPlotSummaryView();

    List<RegionStatsDTO> callAllRegionsSummary();

    List<RegionStatsDTO> callRegionVolumeSummary(@Param("rid") Long regionId);

    List<Map<String, Object>> selectSpeciesDistribution();

    List<Map<String, Object>> selectSpeciesVolumeDistribution();
}
