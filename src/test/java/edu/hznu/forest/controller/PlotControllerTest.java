package edu.hznu.forest.controller;

import com.github.pagehelper.Page;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.service.PlotService;
import edu.hznu.forest.service.TreeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PlotControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PlotService plotService;

    @Mock
    private TreeService treeService;

    @InjectMocks
    private PlotController plotController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(plotController).build();
    }

    @Test
    void getPlots_returnsPagedList() throws Exception {
        Page<Plot> page = new Page<>(1, 3);
        page.setTotal(1L);
        Plot plot = new Plot();
        plot.setPlotId(1L);
        plot.setPlotCode("PLOT-001");
        plot.setRegionId(1L);
        page.add(plot);

        when(plotService.findAll(1, 3)).thenReturn(page);

        mockMvc.perform(get("/api/plots")
                .param("page", "1")
                .param("size", "3"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].plotCode").value("PLOT-001"));
    }

    @Test
    void getPlotById_found() throws Exception {
        Plot plot = new Plot();
        plot.setPlotId(1L);
        plot.setPlotCode("PLOT-001");
        plot.setRegionId(1L);

        when(plotService.findById(1L)).thenReturn(plot);

        mockMvc.perform(get("/api/plots/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.plotCode").value("PLOT-001"));
    }
}
