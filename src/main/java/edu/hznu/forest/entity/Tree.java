package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tree {
    private Long treeId;
    private Long plotId;
    private Long speciesId;
    private String treeNumber;
    private BigDecimal dbh;
    private BigDecimal height;
    private Integer age;
    private String healthStatus;
    /** JOIN查询时的树种名称，非数据库字段 */
    private String speciesName;
}
