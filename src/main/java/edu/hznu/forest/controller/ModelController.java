package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Model;
import edu.hznu.forest.service.ModelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/models")
public class ModelController {

    private final ModelService modelService;

    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping
    public Result<List<Model>> findAll() {
        log.debug("查询所有AI模型");
        return Result.success(modelService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Model> findById(@PathVariable Long id) {
        log.info("查询模型详情: id={}", id);
        return Result.success(modelService.findById(id));
    }
}
