package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Tree;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class FlaskClient {

    private final RestTemplate restTemplate;
    private final String predictUrl;

    public FlaskClient(@Value("${ai.predict.url}") String predictUrl) {
        this.restTemplate = new RestTemplate();
        this.predictUrl = predictUrl;
        log.info("Flask AI客户端初始化, 预测URL: {}", predictUrl);
    }

    public Map<String, Object> predict(Long plotId, List<Tree> trees, Long modelId) {
        log.info("调用Flask AI预测: plotId={}, treeCount={}, modelId={}",
                plotId, trees.size(), modelId);

        // 构建树木列表
        List<Map<String, Object>> treeList = new ArrayList<>();
        for (Tree t : trees) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("dbh", t.getDbh().doubleValue());
            item.put("height", t.getHeight().doubleValue());
            if (t.getSpeciesId() != null) {
                item.put("species_id", t.getSpeciesId());
            }
            treeList.add(item);
        }

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("plot_id", plotId);
            request.put("model_id", modelId);
            request.put("trees", treeList);

            Map<String, Object> response = restTemplate.postForObject(predictUrl, request, Map.class);
            log.info("Flask AI响应: predicted_volume={}", response != null ? response.get("predicted_volume") : null);
            return response;
        } catch (Exception e) {
            log.error("Flask AI调用失败: {}", e.getMessage());
            throw new BusinessException(503, "AI预测服务不可用: " + e.getMessage());
        }
    }
}
