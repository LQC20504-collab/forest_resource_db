package edu.hznu.forest.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegionStatsDTO {
    private Long regionId;
    private String regionName;
    private Integer regionLevel;
    private Integer plotCount;
    private Integer treeCount;
    private BigDecimal totalMeasuredVolume;
    private BigDecimal totalPredictedVolume;
    private BigDecimal avgError;
}
