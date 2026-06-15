package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.entity.Tree;
import edu.hznu.forest.entity.Volume;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis Mapper tests for {@link VolumeMapper}.
 * Tests the {@code sumVolumeByRegion} query which joins volume → tree → plot → region.
 * Uses H2 in-memory database in MySQL compatibility mode.
 */
@MybatisTest
@Sql(scripts = "/schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
@Transactional
class VolumeMapperTest {

    @Autowired
    private VolumeMapper volumeMapper;

    @Autowired
    private PlotMapper plotMapper;

    @Autowired
    private TreeMapper treeMapper;

    @Test
    void sumVolumeByRegion_returnsCorrectSum() {
        // Arrange — build the foreign-key chain: region(100) ← plot ← tree ← volume
        Plot plot = new Plot();
        plot.setPlotCode("VOL_TEST_01");
        plot.setRegionId(100L);
        plot.setLatitude(new BigDecimal("28.5"));
        plot.setLongitude(new BigDecimal("115.8"));
        plot.setElevation(new BigDecimal("150"));
        plot.setArea(new BigDecimal("0.5"));
        plot.setSurveyYear(2025);
        plot.setPlotType("test");
        plotMapper.insert(plot);

        Tree tree = new Tree();
        tree.setPlotId(plot.getPlotId());
        tree.setSpeciesId(1L);
        tree.setTreeNumber("1");
        tree.setDbh(new BigDecimal("35.0"));
        tree.setHeight(new BigDecimal("22.5"));
        tree.setAge(40);
        tree.setHealthStatus("healthy");
        treeMapper.insert(tree);

        Volume vol1 = new Volume();
        vol1.setTreeId(tree.getTreeId());
        vol1.setMeasuredVolume(new BigDecimal("12.5000"));
        vol1.setMeasureDate(LocalDate.of(2025, 6, 1));
        volumeMapper.insert(vol1);

        Volume vol2 = new Volume();
        vol2.setTreeId(tree.getTreeId());
        vol2.setMeasuredVolume(new BigDecimal("8.7500"));
        vol2.setMeasureDate(LocalDate.of(2025, 6, 15));
        volumeMapper.insert(vol2);

        // Act
        BigDecimal sum = volumeMapper.sumVolumeByRegion(100L);

        // Assert — 12.5000 + 8.7500 = 21.2500
        assertThat(sum).isNotNull();
        assertThat(sum.compareTo(new BigDecimal("21.2500"))).isEqualTo(0);
    }

    @Test
    void sumVolumeByRegion_noData_returnsZero() {
        // Act — region with no plots / trees / volumes at all
        BigDecimal sum = volumeMapper.sumVolumeByRegion(999L);

        // Assert — COALESCE(SUM(...), 0) must return BigDecimal.ZERO
        assertThat(sum).isNotNull();
        assertThat(sum.compareTo(BigDecimal.ZERO)).isEqualTo(0);
    }
}
