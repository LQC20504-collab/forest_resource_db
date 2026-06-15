package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OperationLog {
    private Long logId;
    private Long userId;
    private String operation;
    private LocalDateTime operationTime;
    private String details;
}
