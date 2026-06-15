package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.service.TreeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/trees")
public class TreeController {

    private final TreeService treeService;

    public TreeController(TreeService treeService) {
        this.treeService = treeService;
    }

    @GetMapping("/plot/{plotId}")
    public Result<List<Tree>> findByPlotId(@PathVariable Long plotId) {
        log.info("查询样地树木列表: plotId={}", plotId);
        return Result.success(treeService.findByPlotId(plotId));
    }

    @GetMapping("/{id}")
    public Result<Tree> findById(@PathVariable Long id) {
        log.info("查询树木详情: id={}", id);
        return Result.success(treeService.findById(id));
    }

    @PostMapping
    public Result<Tree> create(@RequestBody Tree tree) {
        log.info("创建树木: plotId={}, species={}", tree.getPlotId(), tree.getSpeciesName());
        return Result.success(treeService.create(tree));
    }

    @PostMapping("/batch")
    public Result<List<Tree>> batchCreate(@RequestBody List<Tree> trees) {
        log.info("批量导入树木: {} 棵", trees.size());
        return Result.success(treeService.batchCreate(trees));
    }

    @PutMapping("/{id}")
    public Result<Tree> update(@PathVariable Long id, @RequestBody Tree tree) {
        log.info("更新树木: id={}", id);
        tree.setTreeId(id);
        return Result.success(treeService.update(tree));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除树木: id={}", id);
        treeService.delete(id);
        return Result.ok();
    }
}
