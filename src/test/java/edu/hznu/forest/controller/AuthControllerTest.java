package edu.hznu.forest.controller;

import edu.hznu.forest.common.BusinessException;
import edu.hznu.forest.common.GlobalExceptionHandler;
import edu.hznu.forest.common.Result;
import edu.hznu.forest.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void login_success_returnsToken() throws Exception {
        when(authService.login(anyString(), anyString()))
            .thenReturn(Result.success("jwt-token"));

        String body = "{\"username\": \"admin\", \"password\": \"admin123\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isNotEmpty());
    }

    @Test
    void login_fail_returnsError() throws Exception {
        when(authService.login(anyString(), anyString()))
            .thenThrow(new BusinessException(401, "用户名或密码错误"));

        String body = "{\"username\": \"admin\", \"password\": \"wrong\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401));
    }
}
