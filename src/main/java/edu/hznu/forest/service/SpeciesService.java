package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Species;
import edu.hznu.forest.mapper.SpeciesMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class SpeciesService {
    private final SpeciesMapper speciesMapper;

    public SpeciesService(SpeciesMapper speciesMapper) {
        this.speciesMapper = speciesMapper;
    }

    public List<Species> findAll() {
        log.debug("查询所有树种");
        return speciesMapper.findAll();
    }

    public Species findById(Long id) {
        log.debug("查询树种: id={}", id);
        Species species = speciesMapper.findById(id);
        if (species == null) {
            log.warn("树种不存在: id={}", id);
            throw new BusinessException(404, "资源不存在");
        }
        return species;
    }

    @Transactional
    public Species create(Species species) {
        log.info("创建树种: {}", species.getCommonName());
        speciesMapper.insert(species);
        log.info("树种创建成功: id={}, name={}", species.getSpeciesId(), species.getCommonName());
        return species;
    }

    @Transactional
    public Species update(Species species) {
        log.info("更新树种: id={}", species.getSpeciesId());
        findById(species.getSpeciesId());
        speciesMapper.update(species);
        log.info("树种更新成功: id={}", species.getSpeciesId());
        return species;
    }

    @Transactional
    public void delete(Long id) {
        log.info("删除树种: id={}", id);
        findById(id);
        speciesMapper.delete(id);
        log.info("树种删除成功: id={}", id);
    }
}
