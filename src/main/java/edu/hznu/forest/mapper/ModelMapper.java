package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.Model;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ModelMapper {

    List<Model> findAll();

    Model findById(Long id);

    int insert(Model model);

    int update(Model model);

    int delete(Long id);
}
