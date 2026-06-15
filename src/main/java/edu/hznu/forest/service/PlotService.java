package edu.hznu.forest.service;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.entity.Region;
import edu.hznu.forest.mapper.PlotMapper;
import edu.hznu.forest.mapper.RegionMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class PlotService {

    private final PlotMapper plotMapper;
    private final RegionMapper regionMapper;

    public PlotService(PlotMapper plotMapper, RegionMapper regionMapper) {
        this.plotMapper = plotMapper;
        this.regionMapper = regionMapper;
    }

    public Page<Plot> findAll(int page, int size) {
        log.debug("查询样地列表: page={}, size={}", page, size);
        PageHelper.startPage(page, size);
        return (Page<Plot>) plotMapper.findAll();
    }

    public Plot findById(Long id) {
        log.debug("查询样地: id={}", id);
        Plot plot = plotMapper.findById(id);
        if (plot == null) {
            log.warn("样地不存在: id={}", id);
            throw new BusinessException(404, "样地不存在");
        }
        return plot;
    }

    public List<Plot> findByRegionId(Long regionId) {
        log.debug("查询区域样地: regionId={}", regionId);
        return plotMapper.findByRegionId(regionId);
    }

    public List<Long> findAllPlotIds() {
        log.debug("查询所有样地ID");
        return plotMapper.findAllPlotIds();
    }

    @Transactional
    public Plot create(Plot plot) {
        log.info("创建样地: code={}, regionId={}", plot.getPlotCode(), plot.getRegionId());
        plotMapper.insert(plot);
        log.info("样地创建成功: id={}, code={}", plot.getPlotId(), plot.getPlotCode());
        return plot;
    }

    @Transactional
    public Plot update(Plot plot) {
        log.info("更新样地: id={}, code={}", plot.getPlotId(), plot.getPlotCode());
        findById(plot.getPlotId());
        plotMapper.update(plot);
        log.info("样地更新成功: id={}", plot.getPlotId());
        return plot;
    }

    @Transactional
    public void delete(Long id) {
        log.info("删除样地: id={}", id);
        findById(id);
        plotMapper.delete(id);
        log.info("样地删除成功: id={}", id);
    }

    /**
     * 根据区域名称解析 regionId。
     * 如果传入了 regionId > 0 则直接使用（兼容旧前端）。
     */
    private Long resolveRegionId(Plot plot) {
        if (plot.getRegionId() != null && plot.getRegionId() > 0) {
            return plot.getRegionId();
        }
        /* 如果有 regionName 字段则按名称查找 */
        return null;
    }

    @Transactional
    public List<Plot> batchCreate(List<Plot> plots) {
        log.info("批量创建样地: {} 个", plots.size());
        List<Plot> created = new java.util.ArrayList<>();
        for (Plot plot : plots) {
            /* 如果传了区域名称，解析成 ID */
            if (plot.getRegionName() != null && !plot.getRegionName().isEmpty()) {
                Region region = regionMapper.findByName(plot.getRegionName());
                if (region == null) {
                    log.warn("批量创建失败 - 区域不存在: {}", plot.getRegionName());
                    throw new BusinessException(400, "区域「" + plot.getRegionName() + "」不存在");
                }
                plot.setRegionId(region.getRegionId());
                log.debug("样地区域解析: code={}, regionName={} -> regionId={}",
                        plot.getPlotCode(), plot.getRegionName(), region.getRegionId());
            }
            if (plot.getRegionId() == null || plot.getRegionId() <= 0) {
                log.warn("批量创建失败 - 样地缺少有效区域: {}", plot.getPlotCode());
                throw new BusinessException(400, "样地「" + plot.getPlotCode() + "」缺少有效区域");
            }
            /* 检查样地编号是否已存在，已存在则跳过 */
            Plot existing = plotMapper.findByPlotCode(plot.getPlotCode());
            if (existing != null) {
                log.warn("样地已存在，跳过: code={}", plot.getPlotCode());
                created.add(existing);
                continue;
            }
            plotMapper.insert(plot);
            created.add(plot);
            log.debug("样地已插入: id={}, code={}", plot.getPlotId(), plot.getPlotCode());
        }
        log.info("批量创建样地完成: {}/{} 个", created.size(), plots.size());
        return created;
    }
}
