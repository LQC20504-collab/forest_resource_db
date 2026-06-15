package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.OperationLog;
import edu.hznu.forest.service.OperationLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/operation-logs")
public class OperationLogController {

    private final OperationLogService operationLogService;

    public OperationLogController(OperationLogService operationLogService) {
        this.operationLogService = operationLogService;
    }

    @GetMapping
    public Result<List<OperationLog>> findAll() {
        log.info("查询所有操作日志");
        return Result.success(operationLogService.findAll());
    }

    @GetMapping("/user/{userId}")
    public Result<List<OperationLog>> findByUserId(@PathVariable Long userId) {
        log.info("查询用户操作日志: userId={}", userId);
        return Result.success(operationLogService.findByUserId(userId));
    }
}
