package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.Plot;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis Mapper tests for {@link PlotMapper}.
 * Uses H2 in-memory database in MySQL compatibility mode.
 */
@MybatisTest
@Sql(scripts = "/schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
@Transactional
class PlotMapperTest {

    @Autowired
    private PlotMapper plotMapper;

    @Test
    void findAll_returnsAllPlots() {
        // Arrange
        Plot plot1 = createPlot("PL001", 1L, "30.5", "120.1", "100", "0.5", 2025, "sample", "First plot");
        Plot plot2 = createPlot("PL002", 1L, "31.5", "121.1", "200", "1.0", 2025, "sample", "Second plot");
        plotMapper.insert(plot1);
        plotMapper.insert(plot2);

        // Act
        List<Plot> plots = plotMapper.findAll();

        // Assert – verify our inserted plots are present regardless of pre-existing data
        assertThat(plots).isNotNull();
        assertThat(plots)
                .extracting(Plot::getPlotCode)
                .contains("PL001", "PL002");
        assertThat(plots).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void findByRegionId_returnsPlots() {
        // Arrange
        Plot plot1 = createPlot("PL003", 10L, "30.5", "120.1", "100", "0.5", 2025, "sample", "Region 10 plot");
        Plot plot2 = createPlot("PL004", 20L, "31.5", "121.1", "200", "1.0", 2025, "sample", "Region 20 plot");
        Plot plot3 = createPlot("PL005", 10L, "32.5", "122.1", "300", "1.5", 2025, "sample", "Another region 10 plot");
        plotMapper.insert(plot1);
        plotMapper.insert(plot2);
        plotMapper.insert(plot3);

        // Act
        List<Plot> region10Plots = plotMapper.findByRegionId(10L);

        // Assert
        assertThat(region10Plots).isNotNull();
        assertThat(region10Plots).hasSize(2);
        assertThat(region10Plots)
                .extracting(Plot::getPlotCode)
                .containsExactlyInAnyOrder("PL003", "PL005");
        assertThat(region10Plots)
                .allMatch(p -> p.getRegionId().equals(10L));
    }

    /**
     * Convenience factory for creating Plot instances with string-to-BigDecimal conversion.
     */
    private static Plot createPlot(String plotCode, Long regionId,
                                   String latitude, String longitude,
                                   String elevation, String area,
                                   int surveyYear, String plotType, String description) {
        Plot plot = new Plot();
        plot.setPlotCode(plotCode);
        plot.setRegionId(regionId);
        plot.setLatitude(new BigDecimal(latitude));
        plot.setLongitude(new BigDecimal(longitude));
        plot.setElevation(new BigDecimal(elevation));
        plot.setArea(new BigDecimal(area));
        plot.setSurveyYear(surveyYear);
        plot.setPlotType(plotType);
        plot.setDescription(description);
        return plot;
    }
}
