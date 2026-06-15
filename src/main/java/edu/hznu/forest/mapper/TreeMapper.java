package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.Tree;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface TreeMapper {

    List<Tree> findByPlotId(Long plotId);

    Tree findById(Long id);

    int insert(Tree tree);

    int update(Tree tree);

    int delete(Long id);
}
