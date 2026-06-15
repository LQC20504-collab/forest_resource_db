package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Volume;
import edu.hznu.forest.mapper.VolumeMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class VolumeService {

    private final VolumeMapper volumeMapper;

    public VolumeService(VolumeMapper volumeMapper) {
        this.volumeMapper = volumeMapper;
    }

    public Volume findById(Long id) {
        log.debug("查询蓄积量: id={}", id);
        Volume volume = volumeMapper.findById(id);
        if (volume == null) {
            log.warn("蓄积量数据不存在: id={}", id);
            throw new BusinessException(404, "蓄积量数据不存在");
        }
        return volume;
    }

    public List<Volume> findByPlotId(Long plotId) {
        log.debug("查询样地蓄积量: plotId={}", plotId);
        return volumeMapper.findByPlotId(plotId);
    }

    public List<Volume> findByTreeId(Long treeId) {
        log.debug("查询树木蓄积量: treeId={}", treeId);
        return volumeMapper.findByTreeId(treeId);
    }

    @Transactional
    public Volume create(Volume volume) {
        log.info("新增蓄积量: treeId={}, measuredVolume={}", volume.getTreeId(), volume.getMeasuredVolume());
        volumeMapper.insert(volume);
        log.info("蓄积量新增成功: id={}, treeId={}", volume.getVolId(), volume.getTreeId());
        return volume;
    }

    @Transactional
    public Volume saveOrUpdateByTreeId(Long treeId, Map<String, Object> body) {
        List<Volume> existing = volumeMapper.findByTreeId(treeId);
        BigDecimal measuredVolume = new BigDecimal(body.get("measuredVolume").toString());
        LocalDate measureDate = body.containsKey("measureDate") && body.get("measureDate") != null
            ? LocalDate.parse(body.get("measureDate").toString())
            : LocalDate.now();

        if (existing.isEmpty()) {
            Volume vol = new Volume();
            vol.setTreeId(treeId);
            vol.setMeasuredVolume(measuredVolume);
            vol.setMeasureDate(measureDate);
            volumeMapper.insert(vol);
            log.info("蓄积量新增成功: id={}, treeId={}", vol.getVolId(), treeId);
            return vol;
        } else {
            Volume vol = existing.get(0);
            vol.setMeasuredVolume(measuredVolume);
            vol.setMeasureDate(measureDate);
            volumeMapper.update(vol);
            log.info("蓄积量更新成功: id={}, treeId={}", vol.getVolId(), treeId);
            return vol;
        }
    }

    @Transactional
    public Volume update(Volume volume) {
        log.info("更新蓄积量: id={}", volume.getVolId());
        int rows = volumeMapper.update(volume);
        if (rows == 0) {
            log.warn("蓄积量更新失败 - 数据不存在: id={}", volume.getVolId());
            throw new BusinessException(404, "蓄积量数据不存在");
        }
        log.info("蓄积量更新成功: id={}", volume.getVolId());
        return volume;
    }

    @Transactional
    public void delete(Long id) {
        log.info("删除蓄积量: id={}", id);
        int rows = volumeMapper.delete(id);
        if (rows == 0) {
            log.warn("蓄积量删除失败 - 数据不存在: id={}", id);
            throw new BusinessException(404, "蓄积量数据不存在");
        }
        log.info("蓄积量删除成功: id={}", id);
    }
}
