package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.Volume;
import org.apache.ibatis.annotations.Mapper;
import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface VolumeMapper {

    Volume findById(Long id);

    List<Volume> findByTreeId(Long treeId);

    List<Volume> findByPlotId(Long plotId);

    int insert(Volume volume);

    int update(Volume volume);

    int delete(Long id);

    BigDecimal sumVolumeByRegion(Long regionId);
}
