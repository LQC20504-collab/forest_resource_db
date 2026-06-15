package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.entity.AIPrediction;
import edu.hznu.forest.service.AIPredictionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ai-predictions")
public class AIPredictionController {

    private final AIPredictionService predictionService;

    public AIPredictionController(AIPredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/plot/{plotId}")
    public Result<List<AIPrediction>> findByPlotId(@PathVariable Long plotId) {
        log.info("查询样地AI预测: plotId={}", plotId);
        return Result.success(predictionService.findByPlotId(plotId));
    }

    @GetMapping("/model/{modelId}")
    public Result<List<AIPrediction>> findByModelId(@PathVariable Long modelId) {
        log.info("查询模型预测记录: modelId={}", modelId);
        return Result.success(predictionService.findByModelId(modelId));
    }

    @PostMapping("/predict/{plotId}")
    public Result<AIPrediction> predictFromFlask(@PathVariable Long plotId,
                                                  @RequestParam(required = false, defaultValue = "1") Long modelId) {
        log.info("触发AI预测: plotId={}, modelId={}", plotId, modelId);
        return Result.success(predictionService.predictFromFlask(plotId, modelId));
    }

    @PostMapping("/predict-all")
    public Result<List<AIPrediction>> predictAll(
            @RequestParam(required = false, defaultValue = "1") Long modelId) {
        log.info("触发批量AI预测: modelId={}", modelId);
        return Result.success(predictionService.predictAll(modelId));
    }

    @DeleteMapping
    public Result<Void> deleteAll() {
        log.info("清除所有AI预测记录");
        predictionService.deleteAll();
        return Result.ok();
    }

    @PostMapping
    public Result<AIPrediction> create(@RequestBody AIPrediction prediction) {
        log.info("新增AI预测记录: plotId={}", prediction.getPlotId());
        return Result.success(predictionService.create(prediction));
    }
}
