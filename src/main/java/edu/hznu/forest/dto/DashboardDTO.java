package edu.hznu.forest.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private List<RegionStatsDTO> regionComparison;
    private Map<String, Long> speciesDistribution;
    private Map<String, BigDecimal> speciesVolume;
    private Map<String, Object> totalStats;
}
