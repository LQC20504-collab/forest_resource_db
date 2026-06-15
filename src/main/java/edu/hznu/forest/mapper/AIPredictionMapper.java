package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.AIPrediction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface AIPredictionMapper {

    List<AIPrediction> findByPlotId(Long plotId);

    List<AIPrediction> findByModelId(Long modelId);

    BigDecimal sumPredictedVolumeByPlotIds(@Param("plotIds") List<Long> plotIds);

    int insert(AIPrediction prediction);

    int update(AIPrediction prediction);

    int delete(Long id);

    int deleteAll();

    int deleteAllOperationLogs();

    int deleteByPlotIdAndModelId(@Param("plotId") Long plotId, @Param("modelId") Long modelId);
}
