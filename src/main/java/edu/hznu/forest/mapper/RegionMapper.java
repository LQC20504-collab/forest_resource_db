package edu.hznu.forest.mapper;

import org.apache.ibatis.annotations.Mapper;
import edu.hznu.forest.entity.Region;
import java.util.List;

@Mapper
public interface RegionMapper {

    List<Region> findAll();

    Region findById(Long id);

    Region findByName(String name);

    List<Region> findByParentId(Long parentId);

    int insert(Region region);

    int update(Region region);

    int delete(Long id);
}
