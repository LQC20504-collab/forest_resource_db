package edu.hznu.forest.service;

import edu.hznu.forest.dto.DashboardDTO;
import edu.hznu.forest.dto.RegionStatsDTO;
import edu.hznu.forest.entity.*;
import edu.hznu.forest.mapper.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private RegionMapper regionMapper;

    @Mock
    private PlotMapper plotMapper;

    @Mock
    private TreeMapper treeMapper;

    @Mock
    private VolumeMapper volumeMapper;

    @Mock
    private SpeciesMapper speciesMapper;

    @InjectMocks
    private StatisticsService statisticsService;

    @Test
    void getRegionSummary_success() {
        // Arrange - region
        Region region = new Region(1L, "R001", "Test Region", null, 1);
        when(regionMapper.findById(1L)).thenReturn(region);

        // Arrange - plots
        Plot plot1 = new Plot();
        plot1.setPlotId(1L);
        plot1.setRegionId(1L);
        Plot plot2 = new Plot();
        plot2.setPlotId(2L);
        plot2.setRegionId(1L);
        when(plotMapper.findByRegionId(1L)).thenReturn(List.of(plot1, plot2));

        // Arrange - trees per plot
        Tree tree1 = new Tree();
        tree1.setTreeId(1L);
        tree1.setPlotId(1L);
        Tree tree2 = new Tree();
        tree2.setTreeId(2L);
        tree2.setPlotId(1L);
        Tree tree3 = new Tree();
        tree3.setTreeId(3L);
        tree3.setPlotId(2L);
        when(treeMapper.findByPlotId(1L)).thenReturn(List.of(tree1, tree2));
        when(treeMapper.findByPlotId(2L)).thenReturn(List.of(tree3));

        // Arrange - volumes per tree
        Volume vol1 = new Volume(1L, 1L, new BigDecimal("10.5"), null);
        Volume vol2 = new Volume(2L, 2L, new BigDecimal("20.3"), null);
        Volume vol3 = new Volume(3L, 3L, new BigDecimal("5.2"), null);
        when(volumeMapper.findByTreeId(1L)).thenReturn(List.of(vol1));
        when(volumeMapper.findByTreeId(2L)).thenReturn(List.of(vol2));
        when(volumeMapper.findByTreeId(3L)).thenReturn(List.of(vol3));

        // Act
        RegionStatsDTO result = statisticsService.getRegionSummary(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getRegionId()).isEqualTo(1L);
        assertThat(result.getRegionName()).isEqualTo("Test Region");
        assertThat(result.getPlotCount()).isEqualTo(2);
        assertThat(result.getTreeCount()).isEqualTo(3);
        assertThat(result.getTotalMeasuredVolume())
                .isEqualByComparingTo(new BigDecimal("36.0"));
        assertThat(result.getTotalPredictedVolume())
                .isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getAvgError())
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getRegionSummary_regionNotFound_returnsNull() {
        // Arrange
        when(regionMapper.findById(99L)).thenReturn(null);

        // Act
        RegionStatsDTO result = statisticsService.getRegionSummary(99L);

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void getDashboardData_returnsCompleteData() {
        // Arrange - region
        Region region = new Region(1L, "R001", "Region1", null, 1);
        when(regionMapper.findAll()).thenReturn(List.of(region));
        when(regionMapper.findById(1L)).thenReturn(region);

        // Arrange - species
        Species oak = new Species(1L, "Oak", "Quercus",
                new BigDecimal("0.7"), new BigDecimal("0.5"));
        when(speciesMapper.findAll()).thenReturn(List.of(oak));

        // Arrange - plot
        Plot plot = new Plot();
        plot.setPlotId(1L);
        plot.setRegionId(1L);
        when(plotMapper.findByRegionId(1L)).thenReturn(List.of(plot));

        // Arrange - tree (with speciesId matching Oak)
        Tree tree = new Tree();
        tree.setTreeId(1L);
        tree.setPlotId(1L);
        tree.setSpeciesId(1L);
        // findByPlotId(null) is called in the first species loop;
        // Mockito returns null by default for List, which satisfies the null check
        when(treeMapper.findByPlotId(1L)).thenReturn(List.of(tree));

        // Arrange - volume
        Volume volume = new Volume(1L, 1L, BigDecimal.TEN, null);
        when(volumeMapper.findByTreeId(1L)).thenReturn(List.of(volume));

        // Act
        DashboardDTO result = statisticsService.getDashboardData();

        // Assert
        assertThat(result).isNotNull();

        // regionComparison
        assertThat(result.getRegionComparison()).isNotNull();
        assertThat(result.getRegionComparison()).hasSize(1);
        RegionStatsDTO regionStats = result.getRegionComparison().get(0);
        assertThat(regionStats.getRegionName()).isEqualTo("Region1");
        assertThat(regionStats.getPlotCount()).isEqualTo(1);
        assertThat(regionStats.getTreeCount()).isEqualTo(1);
        assertThat(regionStats.getTotalMeasuredVolume())
                .isEqualByComparingTo(BigDecimal.TEN);

        // speciesDistribution
        Map<String, Long> speciesDist = result.getSpeciesDistribution();
        assertThat(speciesDist).isNotNull();
        assertThat(speciesDist).containsKey("Oak");
        assertThat(speciesDist.get("Oak")).isEqualTo(1L);

        // totalStats
        Map<String, Object> totalStats = result.getTotalStats();
        assertThat(totalStats).isNotNull();
        assertThat(totalStats).containsKeys(
                "totalPlots", "totalTrees", "totalVolume", "regionCount");
        assertThat(totalStats.get("totalPlots")).isEqualTo(1);
        assertThat(totalStats.get("totalTrees")).isEqualTo(1);
        assertThat(totalStats.get("totalVolume")).isEqualTo(BigDecimal.TEN);
        assertThat(totalStats.get("regionCount")).isEqualTo(1);
    }
}
