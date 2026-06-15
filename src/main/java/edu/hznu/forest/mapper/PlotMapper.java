package edu.hznu.forest.mapper;

import org.apache.ibatis.annotations.Mapper;
import edu.hznu.forest.entity.Plot;
import java.util.List;

@Mapper
public interface PlotMapper {

    List<Plot> findAll();

    Plot findById(Long id);

    List<Plot> findByRegionId(Long regionId);

    List<Long> findAllPlotIds();

    Plot findByPlotCode(String plotCode);

    int insert(Plot plot);

    int update(Plot plot);

    int delete(Long id);
}
