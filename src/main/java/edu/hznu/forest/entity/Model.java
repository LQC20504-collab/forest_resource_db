package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Model {
    private Long modelId;
    private String modelName;
    private String algorithm;
    private LocalDate trainDate;
    private BigDecimal rSquared;
    private BigDecimal rmse;
    private String featureList;
    private String description;
}
