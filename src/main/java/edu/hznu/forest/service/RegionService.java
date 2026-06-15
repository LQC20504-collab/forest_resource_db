package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Region;
import edu.hznu.forest.mapper.RegionMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class RegionService {
    private final RegionMapper regionMapper;

    public RegionService(RegionMapper regionMapper) {
        this.regionMapper = regionMapper;
    }

    public List<Region> findAll() {
        log.debug("查询所有区域");
        return regionMapper.findAll();
    }

    public Region findById(Long id) {
        log.debug("查询区域: id={}", id);
        Region region = regionMapper.findById(id);
        if (region == null) {
            log.warn("区域不存在: id={}", id);
            throw new BusinessException(404, "资源不存在");
        }
        return region;
    }

    public List<Region> findByParentId(Long parentId) {
        log.debug("查询子区域: parentId={}", parentId);
        return regionMapper.findByParentId(parentId);
    }

    @Transactional
    public Region create(Region region) {
        log.info("创建区域: {}", region.getName());
        regionMapper.insert(region);
        log.info("区域创建成功: id={}, name={}", region.getRegionId(), region.getName());
        return region;
    }

    @Transactional
    public Region update(Region region) {
        log.info("更新区域: id={}", region.getRegionId());
        findById(region.getRegionId());
        regionMapper.update(region);
        log.info("区域更新成功: id={}", region.getRegionId());
        return region;
    }

    @Transactional
    public void delete(Long id) {
        log.info("删除区域: id={}", id);
        findById(id);
        regionMapper.delete(id);
        log.info("区域删除成功: id={}", id);
    }
}
