package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Region {
    private Long regionId;
    private String regionCode;
    private String name;
    private Long parentId;
    private Integer level;
}
