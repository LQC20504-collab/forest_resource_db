package edu.hznu.forest.controller;

import edu.hznu.forest.dto.DashboardDTO;
import edu.hznu.forest.dto.RegionStatsDTO;
import edu.hznu.forest.service.StatisticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StatisticsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StatisticsService statisticsService;

    @InjectMocks
    private StatisticsController statisticsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(statisticsController).build();
    }

    @Test
    void getDashboard_returnsCompleteData() throws Exception {
        DashboardDTO dto = new DashboardDTO();
        dto.setRegionComparison(List.of(new RegionStatsDTO(1L, "Region1", 10, 100, null, null, null)));
        dto.setSpeciesDistribution(Map.of("Oak", 10L));
        dto.setTotalStats(Map.of("totalPlots", 100));

        when(statisticsService.getDashboardData()).thenReturn(dto);

        mockMvc.perform(get("/api/statistics/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.regionComparison").isArray());
    }

    @Test
    void getAllRegions_returnsList() throws Exception {
        List<RegionStatsDTO> list = List.of(
            new RegionStatsDTO(1L, "Region1", 10, 100, null, null, null)
        );

        when(statisticsService.getAllRegionsSummary()).thenReturn(list);

        mockMvc.perform(get("/api/statistics/regions"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray());
    }
}
