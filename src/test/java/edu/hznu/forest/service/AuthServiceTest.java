package edu.hznu.forest.service;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.config.JwtUtil;
import edu.hznu.forest.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_success() {
        // Arrange
        User user = new User(1L, "testuser", "encodedPass", "USER",
                "Test User", "13800138000", LocalDateTime.now());
        when(userService.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("password", "encodedPass")).thenReturn(true);
        when(jwtUtil.generateToken("testuser")).thenReturn("test-token");

        // Act
        Result<String> result = authService.login("testuser", "password");

        // Assert
        assertThat(result.getCode()).isEqualTo(200);
        assertThat(result.getData()).isEqualTo("test-token");
        assertThat(result.getMessage()).isEqualTo("success");
    }

    @Test
    void login_fail_wrongPassword() {
        // Arrange
        User user = new User(1L, "testuser", "encodedPass", "USER", null, null, null);
        when(userService.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("wrongpass", "encodedPass")).thenReturn(false);

        // Act
        Result<String> result = authService.login("testuser", "wrongpass");

        // Assert
        assertThat(result.getCode()).isEqualTo(401);
        assertThat(result.getMessage()).isEqualTo("用户名或密码错误");
    }

    @Test
    void login_fail_userNotFound() {
        // Arrange
        when(userService.findByUsername("nonexistent")).thenReturn(null);

        // Act
        Result<String> result = authService.login("nonexistent", "password");

        // Assert
        assertThat(result.getCode()).isEqualTo(401);
        assertThat(result.getMessage()).isEqualTo("用户名或密码错误");
    }

    @Test
    void register_success() {
        // Arrange
        when(userService.findByUsername("newuser")).thenReturn(null);

        // Act
        Result<Void> result = authService.register("newuser", "password");

        // Assert
        assertThat(result.getCode()).isEqualTo(200);
    }

    @Test
    void register_duplicateUsername() {
        // Arrange
        User existingUser = new User(1L, "existing", "pass", "USER", null, null, null);
        when(userService.findByUsername("existing")).thenReturn(existingUser);

        // Act
        Result<Void> result = authService.register("existing", "password");

        // Assert
        assertThat(result.getCode()).isEqualTo(400);
        assertThat(result.getMessage()).isEqualTo("用户名已存在");
    }
}
