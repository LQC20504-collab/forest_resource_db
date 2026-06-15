package edu.hznu.forest.dto;

import java.math.BigDecimal;

public class PlotDTO {
    private String plotCode;
    private Long regionId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal elevation;
    private BigDecimal area;
    private Integer surveyYear;
    private String plotType;
    private String description;

    public String getPlotCode() { return plotCode; }
    public void setPlotCode(String plotCode) { this.plotCode = plotCode; }

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public BigDecimal getElevation() { return elevation; }
    public void setElevation(BigDecimal elevation) { this.elevation = elevation; }

    public BigDecimal getArea() { return area; }
    public void setArea(BigDecimal area) { this.area = area; }

    public Integer getSurveyYear() { return surveyYear; }
    public void setSurveyYear(Integer surveyYear) { this.surveyYear = surveyYear; }

    public String getPlotType() { return plotType; }
    public void setPlotType(String plotType) { this.plotType = plotType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
