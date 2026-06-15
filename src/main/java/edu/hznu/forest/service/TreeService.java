package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Species;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.mapper.SpeciesMapper;
import edu.hznu.forest.mapper.TreeMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class TreeService {

    private final TreeMapper treeMapper;
    private final SpeciesMapper speciesMapper;

    public TreeService(TreeMapper treeMapper, SpeciesMapper speciesMapper) {
        this.treeMapper = treeMapper;
        this.speciesMapper = speciesMapper;
    }

    /**
     * 根据 speciesName 查找或创建物种，返回 speciesId。
     * 如果传入了 speciesId 且 speciesId > 0，优先使用它（兼容旧前端）。
     */
    private Long resolveSpeciesId(Tree tree) {
        if (tree.getSpeciesId() != null && tree.getSpeciesId() > 0) {
            return tree.getSpeciesId();
        }
        String name = tree.getSpeciesName();
        if (name == null || name.trim().isEmpty()) {
            throw new BusinessException(400, "请指定树种名称");
        }
        name = name.trim();
        log.debug("解析树种: name={}", name);
        Species existing = speciesMapper.findByCommonName(name);
        if (existing != null) {
            log.debug("找到已有树种: name={}, id={}", name, existing.getSpeciesId());
            return existing.getSpeciesId();
        }
        Species newSpecies = new Species();
        newSpecies.setCommonName(name);
        speciesMapper.insert(newSpecies);
        log.info("自动创建新树种: id={}, name={}", newSpecies.getSpeciesId(), name);
        return newSpecies.getSpeciesId();
    }

    public List<Tree> findByPlotId(Long plotId) {
        log.debug("查询样地树木: plotId={}", plotId);
        return treeMapper.findByPlotId(plotId);
    }

    public Tree findById(Long id) {
        log.debug("查询树木: id={}", id);
        Tree tree = treeMapper.findById(id);
        if (tree == null) {
            log.warn("树木不存在: id={}", id);
            throw new BusinessException(404, "树木不存在");
        }
        return tree;
    }

    @Transactional
    public Tree create(Tree tree) {
        log.info("创建树木: plotId={}, speciesName={}", tree.getPlotId(), tree.getSpeciesName());
        tree.setSpeciesId(resolveSpeciesId(tree));
        treeMapper.insert(tree);
        log.info("树木创建成功: id={}, plotId={}", tree.getTreeId(), tree.getPlotId());
        return tree;
    }

    @Transactional
    public List<Tree> batchCreate(List<Tree> trees) {
        log.info("批量创建树木: {} 棵", trees.size());
        for (Tree tree : trees) {
            tree.setSpeciesId(resolveSpeciesId(tree));
            treeMapper.insert(tree);
            log.debug("树木已插入: id={}, plotId={}, speciesId={}",
                    tree.getTreeId(), tree.getPlotId(), tree.getSpeciesId());
        }
        log.info("批量创建树木完成: {} 棵", trees.size());
        return trees;
    }

    @Transactional
    public Tree update(Tree tree) {
        log.info("更新树木: id={}", tree.getTreeId());
        findById(tree.getTreeId());
        tree.setSpeciesId(resolveSpeciesId(tree));
        treeMapper.update(tree);
        log.info("树木更新成功: id={}", tree.getTreeId());
        return tree;
    }

    @Transactional
    public void delete(Long id) {
        log.info("删除树木: id={}", id);
        findById(id);
        treeMapper.delete(id);
        log.info("树木删除成功: id={}", id);
    }
}
