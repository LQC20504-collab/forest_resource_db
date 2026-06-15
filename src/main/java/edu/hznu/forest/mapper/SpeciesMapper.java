package edu.hznu.forest.mapper;

import org.apache.ibatis.annotations.Mapper;
import edu.hznu.forest.entity.Species;
import java.util.List;

@Mapper
public interface SpeciesMapper {

    List<Species> findAll();

    Species findById(Long id);

    Species findByCommonName(String commonName);

    int insert(Species species);

    int update(Species species);

    int delete(Long id);
}
