package edu.hznu.forest;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.entity.AIPrediction;
import edu.hznu.forest.mapper.AIPredictionMapper;
import edu.hznu.forest.service.AIPredictionService;
import edu.hznu.forest.service.FlaskClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Integration tests for the AI Prediction service.
 *
 * Uses H2 in-memory database (real services for PlotService, TreeService)
 * combined with MockRestServiceServer to stub the external Flask HTTP endpoint
 * and a mock AIPredictionMapper to avoid MyBatis XML binding issues in SB 4.x.
 */
@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.hikari.maximum-pool-size=2",
        "pagehelper.helper-dialect=h2",
        "mybatis.mapper-locations=classpath:mapper/*.xml",
        "spring.main.allow-bean-definition-overriding=true"
    }
)
@Sql(
    scripts = {"/schema.sql", "/test-ai-data.sql"},
    executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS
)
class AIIntegrationTest {

    /** Override the real AIPredictionMapper with a mock to avoid XML binding issues. */
    @TestConfiguration
    static class MockMapperConfig {
        @Bean
        @Primary
        public AIPredictionMapper aiPredictionMapper() {
            return Mockito.mock(AIPredictionMapper.class);
        }
    }

    @Autowired
    private AIPredictionService predictionService;

    @Autowired
    private FlaskClient flaskClient;

    @Autowired
    private AIPredictionMapper predictionMapper;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        // Wire MockRestServiceServer to FlaskClient's internal RestTemplate.
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils
                .getField(flaskClient, "restTemplate");

        if (mockServer == null) {
            mockServer = MockRestServiceServer.bindTo(restTemplate).build();
        } else {
            mockServer.reset();
        }

        // Mock the mapper insert to accept any AIPrediction.
        when(predictionMapper.insert(any(AIPrediction.class))).thenReturn(1);
    }

    @Test
    void flaskPrediction_success() throws Exception {
        mockServer.expect(requestTo("http://localhost:5000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(
                        """
                        {"predicted_volume": 123.45, "confidence": 0.95}
                        """,
                        MediaType.APPLICATION_JSON));

        AIPrediction prediction = predictionService.predictFromFlask(1L);

        assertThat(prediction).isNotNull();
        assertThat(prediction.getPlotId()).isEqualTo(1L);
        assertThat(prediction.getModelId()).isEqualTo(1L);
        assertThat(prediction.getPredictedVolume())
                .isEqualByComparingTo(new BigDecimal("123.45"));
        assertThat(prediction.getConfidence())
                .isEqualByComparingTo(new BigDecimal("0.95"));

        mockServer.verify();
    }

    @Test
    void flaskPrediction_serviceUnavailable_returnsError() {
        mockServer.expect(requestTo("http://localhost:5000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> predictionService.predictFromFlask(1L));

        assertThat(exception.getCode()).isEqualTo(503);
        assertThat(exception.getMessage()).contains("AI预测服务不可用");

        mockServer.verify();
    }
}
