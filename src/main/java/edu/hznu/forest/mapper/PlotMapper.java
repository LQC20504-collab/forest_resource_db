package edu.hznu.forest.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import edu.hznu.forest.entity.Plot;
import java.util.List;

@Mapper
public interface PlotMapper {

    List<Plot> findAll();

    Plot findById(Long id);

    List<Plot> findByRegionId(Long regionId);

    List<Long> findAllPlotIds();

    Plot findByPlotCode(String plotCode);

    List<java.util.Map<String, Object>> exportData(@Param("regionId") Long regionId,
                                                    @Param("minLng") Double minLng,
                                                    @Param("minLat") Double minLat,
                                                    @Param("maxLng") Double maxLng,
                                                    @Param("maxLat") Double maxLat);

    int insert(Plot plot);

    int update(Plot plot);

    int delete(Long id);
}
