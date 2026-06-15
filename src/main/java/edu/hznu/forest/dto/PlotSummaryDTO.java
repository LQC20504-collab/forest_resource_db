package edu.hznu.forest.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlotSummaryDTO {
    private Long plotId;
    private String plotCode;
    private String regionName;
    private Integer treeCount;
    private BigDecimal totalVolume;
    private BigDecimal aiPredictedVolume;
}
