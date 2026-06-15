package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Species;
import edu.hznu.forest.service.SpeciesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/species")
public class SpeciesController {

    private final SpeciesService speciesService;

    public SpeciesController(SpeciesService speciesService) {
        this.speciesService = speciesService;
    }

    @GetMapping
    public Result<List<Species>> findAll() {
        log.debug("查询所有树种");
        return Result.success(speciesService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Species> findById(@PathVariable Long id) {
        log.info("查询树种详情: id={}", id);
        return Result.success(speciesService.findById(id));
    }

    @PostMapping
    public Result<Species> create(@RequestBody Species species) {
        log.info("创建树种: {}", species.getCommonName());
        return Result.success(speciesService.create(species));
    }

    @PutMapping("/{id}")
    public Result<Species> update(@PathVariable Long id, @RequestBody Species species) {
        log.info("更新树种: id={}", id);
        species.setSpeciesId(id);
        return Result.success(speciesService.update(species));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除树种: id={}", id);
        speciesService.delete(id);
        return Result.ok();
    }
}
