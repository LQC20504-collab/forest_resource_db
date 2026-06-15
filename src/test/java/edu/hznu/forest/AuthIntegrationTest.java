package edu.hznu.forest;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.hznu.forest.common.Result;
import edu.hznu.forest.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the full auth flow:
 *   register → login → JWT → access protected API → deny without token.
 *
 * Uses H2 in-memory database and MockMvc so no real MySQL or HTTP server needed.
 */
@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.hikari.maximum-pool-size=2",
        "pagehelper.helper-dialect=h2",
        "mybatis.mapper-locations=classpath:mapper/*.xml"
    }
)
@AutoConfigureMockMvc
@Sql(scripts = "/schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class AuthIntegrationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    private String jwtToken;

    private static final String TEST_USER = "integration-test-user";
    private static final String TEST_PASS = "testpass123";

    @BeforeEach
    void setUp() throws Exception {
        // Register test user.
        LoginRequest registerRequest = new LoginRequest();
        registerRequest.setUsername(TEST_USER);
        registerRequest.setPassword(TEST_PASS);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // Login to obtain JWT.
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(TEST_USER);
        loginRequest.setPassword(TEST_PASS);

        var loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isNotEmpty())
            .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        jwtToken = (String) objectMapper.readValue(json, Result.class).getData();
        assertThat(jwtToken).isNotBlank();
    }

    @Test
    void fullAuthFlow_loginAndAccessProtectedApi() throws Exception {
        // Access protected API with valid JWT → 200 OK
        mockMvc.perform(get("/api/plots")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken))
            .andExpect(status().isOk());

        // Access protected API WITHOUT token → 403 Forbidden
        // (Spring Boot 4.x uses Http403ForbiddenEntryPoint by default)
        mockMvc.perform(get("/api/plots"))
            .andExpect(status().isForbidden());
    }

    @Test
    void loginWithInvalidCredentials_returnsError() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(TEST_USER);
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401))
            .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }
}
