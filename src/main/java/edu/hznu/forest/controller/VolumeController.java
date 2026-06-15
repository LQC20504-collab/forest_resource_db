package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.Volume;
import edu.hznu.forest.service.VolumeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/volumes")
public class VolumeController {

    private final VolumeService volumeService;

    public VolumeController(VolumeService volumeService) {
        this.volumeService = volumeService;
    }

    @GetMapping("/plot/{plotId}")
    public Result<List<Volume>> findByPlotId(@PathVariable Long plotId) {
        log.info("查询样地蓄积量: plotId={}", plotId);
        return Result.success(volumeService.findByPlotId(plotId));
    }

    @GetMapping("/tree/{treeId}")
    public Result<Volume> findByTreeId(@PathVariable Long treeId) {
        log.info("查询树木蓄积量: treeId={}", treeId);
        List<Volume> list = volumeService.findByTreeId(treeId);
        return Result.success(list.isEmpty() ? null : list.get(0));
    }

    @GetMapping("/{id}")
    public Result<Volume> findById(@PathVariable Long id) {
        log.info("查询蓄积量详情: id={}", id);
        return Result.success(volumeService.findById(id));
    }

    @PostMapping
    public Result<Volume> create(@RequestBody Volume volume) {
        log.info("新增蓄积量记录: treeId={}", volume.getTreeId());
        return Result.success(volumeService.create(volume));
    }

    @PutMapping("/tree/{treeId}")
    public Result<Volume> updateByTreeId(@PathVariable Long treeId, @RequestBody Map<String, Object> body) {
        log.info("更新树木蓄积量: treeId={}", treeId);
        Volume volume = volumeService.saveOrUpdateByTreeId(treeId, body);
        return Result.success(volume);
    }
}
