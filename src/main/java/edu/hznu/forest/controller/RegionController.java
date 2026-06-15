package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Region;
import edu.hznu.forest.service.RegionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/regions")
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping
    public Result<List<Region>> findAll() {
        log.debug("查询所有区域");
        return Result.success(regionService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Region> findById(@PathVariable Long id) {
        log.info("查询区域详情: id={}", id);
        return Result.success(regionService.findById(id));
    }

    @GetMapping("/{id}/children")
    public Result<List<Region>> findByParentId(@PathVariable Long id) {
        log.debug("查询子区域: parentId={}", id);
        return Result.success(regionService.findByParentId(id));
    }

    @PostMapping
    public Result<Region> create(@RequestBody Region region) {
        log.info("创建区域: {}", region.getName());
        return Result.success(regionService.create(region));
    }

    @PutMapping("/{id}")
    public Result<Region> update(@PathVariable Long id, @RequestBody Region region) {
        log.info("更新区域: id={}", id);
        region.setRegionId(id);
        return Result.success(regionService.update(region));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除区域: id={}", id);
        regionService.delete(id);
        return Result.ok();
    }
}
