package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plot {
    private Long plotId;
    private String plotCode;
    private Long regionId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal elevation;
    private BigDecimal area;
    private Integer surveyYear;
    private String plotType;
    private String description;
    /** 树木数量（列表查询用，不持久化） */
    private Integer treeCount;
    /** 区域名称（批量导入用，不持久化） */
    private String regionName;
}
