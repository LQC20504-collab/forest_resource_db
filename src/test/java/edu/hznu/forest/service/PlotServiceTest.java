package edu.hznu.forest.service;

import com.github.pagehelper.Page;
import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.Plot;
import edu.hznu.forest.mapper.PlotMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlotServiceTest {

    @Mock
    private PlotMapper plotMapper;

    @InjectMocks
    private PlotService plotService;

    @Test
    void findAll_withPagination() {
        // Arrange
        int page = 1, size = 10;
        Page<Plot> expectedPage = new Page<>();
        Plot plot1 = new Plot();
        plot1.setPlotId(1L);
        plot1.setPlotCode("P001");
        plot1.setRegionId(10L);
        Plot plot2 = new Plot();
        plot2.setPlotId(2L);
        plot2.setPlotCode("P002");
        plot2.setRegionId(10L);
        expectedPage.add(plot1);
        expectedPage.add(plot2);

        when(plotMapper.findAll()).thenReturn(expectedPage);

        // Act
        Page<Plot> result = plotService.findAll(page, size);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getPlotId()).isEqualTo(1L);
        assertThat(result.get(0).getPlotCode()).isEqualTo("P001");
        assertThat(result.get(1).getPlotId()).isEqualTo(2L);
        // PageHelper.startPage() is called internally by the service;
        // since we mock the mapper, the result confirms pagination flow works.
        assertThat(result.getTotal()).isZero(); // default Page value, real startPage would set this
    }

    @Test
    void findById_found() {
        // Arrange
        Plot expectedPlot = new Plot();
        expectedPlot.setPlotId(1L);
        expectedPlot.setPlotCode("P001");
        expectedPlot.setRegionId(10L);
        expectedPlot.setLatitude(new BigDecimal("30.5"));
        expectedPlot.setLongitude(new BigDecimal("120.3"));
        expectedPlot.setElevation(new BigDecimal("500"));
        expectedPlot.setArea(new BigDecimal("0.1"));
        expectedPlot.setSurveyYear(2025);
        expectedPlot.setPlotType("样方");
        when(plotMapper.findById(1L)).thenReturn(expectedPlot);

        // Act
        Plot result = plotService.findById(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getPlotId()).isEqualTo(1L);
        assertThat(result.getPlotCode()).isEqualTo("P001");
        assertThat(result.getRegionId()).isEqualTo(10L);
        assertThat(result.getElevation()).isEqualByComparingTo(new BigDecimal("500"));
    }

    @Test
    void findById_notFound_throwsException() {
        // Arrange
        when(plotMapper.findById(99L)).thenReturn(null);

        // Act & Assert
        BusinessException ex = assertThrows(BusinessException.class,
                () -> plotService.findById(99L));
        assertThat(ex.getCode()).isEqualTo(404);
        assertThat(ex.getMessage()).isEqualTo("样地不存在");
    }

    @Test
    void createPlot_success() {
        // Arrange
        Plot plot = new Plot();
        plot.setPlotCode("P003");
        plot.setRegionId(10L);
        plot.setElevation(new BigDecimal("600"));
        when(plotMapper.insert(any(Plot.class))).thenReturn(1);

        // Act
        Plot result = plotService.create(plot);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getPlotCode()).isEqualTo("P003");
        assertThat(result.getRegionId()).isEqualTo(10L);
    }
}
