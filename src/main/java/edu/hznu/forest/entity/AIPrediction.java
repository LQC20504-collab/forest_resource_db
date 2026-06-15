package edu.hznu.forest.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIPrediction {
    private Long predId;
    private Long plotId;
    private Long modelId;
    private BigDecimal predictedVolume;
    private BigDecimal confidence;
    private LocalDateTime predictTime;

    /** 模型名称，来自 Flask 返回，不持久化到数据库 */
    @JsonProperty("model")
    private String modelName;
}
