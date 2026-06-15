package edu.hznu.forest.service;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Model;
import edu.hznu.forest.mapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModelService {
    private final ModelMapper modelMapper;

    public ModelService(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
    }

    public List<Model> findAll() {
        return modelMapper.findAll();
    }

    public Model findById(Long id) {
        Model model = modelMapper.findById(id);
        if (model == null) {
            throw new BusinessException(404, "资源不存在");
        }
        return model;
    }

    @Transactional
    public Model create(Model model) {
        modelMapper.insert(model);
        return model;
    }

    @Transactional
    public Model update(Model model) {
        findById(model.getModelId());
        modelMapper.update(model);
        return model;
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        modelMapper.delete(id);
    }
}
