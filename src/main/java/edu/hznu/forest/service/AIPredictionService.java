package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.AIPrediction;
import edu.hznu.forest.entity.Model;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.mapper.AIPredictionMapper;
import edu.hznu.forest.mapper.ModelMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AIPredictionService {

    private final AIPredictionMapper predictionMapper;
    private final PlotService plotService;
    private final TreeService treeService;
    private final FlaskClient flaskClient;
    private final ModelMapper modelMapper;

    public AIPredictionService(AIPredictionMapper predictionMapper, PlotService plotService,
                                TreeService treeService, FlaskClient flaskClient,
                                ModelMapper modelMapper) {
        this.predictionMapper = predictionMapper;
        this.plotService = plotService;
        this.treeService = treeService;
        this.flaskClient = flaskClient;
        this.modelMapper = modelMapper;
    }

    public List<AIPrediction> findByPlotId(Long plotId) {
        log.debug("查询样地AI预测: plotId={}", plotId);
        return predictionMapper.findByPlotId(plotId);
    }

    public List<AIPrediction> findByModelId(Long modelId) {
        log.debug("查询模型预测记录: modelId={}", modelId);
        return predictionMapper.findByModelId(modelId);
    }

    @Transactional
    public AIPrediction predictFromFlask(Long plotId, Long modelId) {
        log.info("开始AI预测: plotId={}, modelId={}", plotId, modelId);
        Plot plot = plotService.findById(plotId);
        List<Tree> trees = treeService.findByPlotId(plotId);

        if (trees.isEmpty()) {
            log.warn("AI预测失败 - 样地无树木: plotId={}", plotId);
            throw new BusinessException(400, "样地中没有树木数据，无法预测");
        }

        log.info("AI预测: plotId={}, treeCount={}, modelId={}", plotId, trees.size(), modelId);

        // 先删除该样地同一模型的旧预测及关联操作日志
        predictionMapper.deleteByPlotIdAndModelId(plotId, modelId);

        // 将全部树木数据发给 Flask，逐棵计算后累加
        Map<String, Object> result = flaskClient.predict(plotId, trees, modelId);

        AIPrediction prediction = new AIPrediction();
        prediction.setPlotId(plotId);
        prediction.setModelId(modelId);
        prediction.setPredictedVolume(new BigDecimal(result.get("predicted_volume").toString()));
        prediction.setConfidence(new BigDecimal(result.get("confidence").toString()));
        prediction.setPredictTime(LocalDateTime.now());
        /* 从 model 表查询模型名称 */
        Model model = modelMapper.findById(modelId);
        if (model != null) {
            prediction.setModelName(model.getModelName());
        }

        predictionMapper.insert(prediction);
        log.info("AI预测完成: plotId={}, 预测蓄积量={}, 置信度={}, 模型={}",
                plotId, prediction.getPredictedVolume(), prediction.getConfidence(), prediction.getModelName());
        return prediction;
    }

    /**
     * 批量预测所有样地
     */
    @Transactional
    public List<AIPrediction> predictAll(Long modelId) {
        log.info("开始批量AI预测: modelId={}", modelId);
        List<Long> allPlotIds = plotService.findAllPlotIds();
        List<AIPrediction> results = new ArrayList<>();
        for (Long plotId : allPlotIds) {
            try {
                results.add(predictFromFlask(plotId, modelId));
            } catch (Exception e) {
                log.warn("样地{}预测跳过: {}", plotId, e.getMessage());
            }
        }
        log.info("批量AI预测完成: {}/{}", results.size(), allPlotIds.size());
        return results;
    }

    @Transactional
    public void deleteAll() {
        log.info("清除所有AI预测记录及关联操作日志");
        // 先删 operation_log（触发器记录的那条）
        predictionMapper.deleteAllOperationLogs();
        // 再删 ai_prediction
        predictionMapper.deleteAll();
        log.info("AI预测记录清除完成");
    }

    @Transactional
    public AIPrediction create(AIPrediction prediction) {
        log.info("新增AI预测记录: plotId={}, predictedVolume={}, model={}",
                prediction.getPlotId(), prediction.getPredictedVolume(), prediction.getModelName());
        predictionMapper.insert(prediction);
        log.info("AI预测记录新增成功: id={}, plotId={}", prediction.getPredId(), prediction.getPlotId());
        return prediction;
    }
}
