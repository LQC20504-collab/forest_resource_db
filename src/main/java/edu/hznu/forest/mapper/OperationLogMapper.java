package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.OperationLog;
import org.apache.ibatis.annotations.Mapper;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface OperationLogMapper {

    List<OperationLog> findAll();

    List<OperationLog> findByUserId(Long userId);

    List<OperationLog> findByTimeRange(LocalDateTime start, LocalDateTime end);

    int insert(OperationLog log);
}
