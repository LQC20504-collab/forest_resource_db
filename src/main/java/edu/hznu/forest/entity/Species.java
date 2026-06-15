package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Species {
    private Long speciesId;
    private String commonName;
    private String latinName;
    private BigDecimal woodDensity;
    private BigDecimal carbonCoefficient;
}
