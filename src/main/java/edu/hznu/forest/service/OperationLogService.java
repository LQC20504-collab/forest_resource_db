package edu.hznu.forest.service;

import edu.hznu.forest.entity.OperationLog;
import edu.hznu.forest.mapper.OperationLogMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperationLogService {
    private final OperationLogMapper operationLogMapper;

    public OperationLogService(OperationLogMapper operationLogMapper) {
        this.operationLogMapper = operationLogMapper;
    }

    public List<OperationLog> findAll() {
        return operationLogMapper.findAll();
    }

    public List<OperationLog> findByUserId(Long userId) {
        return operationLogMapper.findByUserId(userId);
    }
}
