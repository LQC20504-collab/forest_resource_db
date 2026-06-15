package edu.hznu.forest.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class VolumeDTO {
    private Long treeId;
    private BigDecimal measuredVolume;
    private LocalDate measureDate;

    public Long getTreeId() { return treeId; }
    public void setTreeId(Long treeId) { this.treeId = treeId; }

    public BigDecimal getMeasuredVolume() { return measuredVolume; }
    public void setMeasuredVolume(BigDecimal measuredVolume) { this.measuredVolume = measuredVolume; }

    public LocalDate getMeasureDate() { return measureDate; }
    public void setMeasureDate(LocalDate measureDate) { this.measureDate = measureDate; }
}
