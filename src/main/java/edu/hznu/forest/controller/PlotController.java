package edu.hznu.forest.controller;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageInfo;
import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.service.PlotService;
import edu.hznu.forest.service.TreeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/plots")
public class PlotController {

    private final PlotService plotService;
    private final TreeService treeService;

    public PlotController(PlotService plotService, TreeService treeService) {
        this.plotService = plotService;
        this.treeService = treeService;
    }

    @GetMapping
    public Result<PageInfo<Plot>> findAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("查询样地列表 - page: {}, size: {}", page, size);
        Page<Plot> plots = plotService.findAll(page, size);
        return Result.success(new PageInfo<>(plots));
    }

    @GetMapping("/{id}")
    public Result<Plot> findById(@PathVariable Long id) {
        log.info("查询样地详情: id={}", id);
        return Result.success(plotService.findById(id));
    }

    @GetMapping("/{id}/trees")
    public Result<List<Tree>> findTrees(@PathVariable Long id) {
        log.info("查询样地树木: plotId={}", id);
        return Result.success(treeService.findByPlotId(id));
    }

    @PostMapping
    public Result<Plot> create(@RequestBody Plot plot) {
        log.info("创建样地: {}", plot.getPlotCode());
        return Result.success(plotService.create(plot));
    }

    @PostMapping("/batch")
    public Result<List<Plot>> batchCreate(@RequestBody List<Plot> plots) {
        log.info("批量导入样地: {} 个", plots.size());
        return Result.success(plotService.batchCreate(plots));
    }

    @PutMapping("/{id}")
    public Result<Plot> update(@PathVariable Long id, @RequestBody Plot plot) {
        log.info("更新样地: id={}, code={}", id, plot.getPlotCode());
        plot.setPlotId(id);
        return Result.success(plotService.update(plot));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除样地: id={}", id);
        plotService.delete(id);
        return Result.ok();
    }
}
