package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Volume {
    private Long volId;
    private Long treeId;
    private BigDecimal measuredVolume;
    private LocalDate measureDate;
}
