package edu.hznu.forest.dto;

import java.math.BigDecimal;

public class TreeDTO {
    private Long plotId;
    private Long speciesId;
    private Integer treeNumber;
    private BigDecimal dbh;
    private BigDecimal height;
    private Integer age;
    private String healthStatus;

    public Long getPlotId() { return plotId; }
    public void setPlotId(Long plotId) { this.plotId = plotId; }

    public Long getSpeciesId() { return speciesId; }
    public void setSpeciesId(Long speciesId) { this.speciesId = speciesId; }

    public Integer getTreeNumber() { return treeNumber; }
    public void setTreeNumber(Integer treeNumber) { this.treeNumber = treeNumber; }

    public BigDecimal getDbh() { return dbh; }
    public void setDbh(BigDecimal dbh) { this.dbh = dbh; }

    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }
}
