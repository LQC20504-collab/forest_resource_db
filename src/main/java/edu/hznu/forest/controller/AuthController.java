package edu.hznu.forest.controller;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.config.JwtUtil;
import edu.hznu.forest.dto.ChangePasswordRequest;
import edu.hznu.forest.dto.LoginRequest;
import edu.hznu.forest.dto.RegisterRequest;
import edu.hznu.forest.dto.UpdateProfileRequest;
import edu.hznu.forest.entity.User;
import edu.hznu.forest.service.AuthService;
import edu.hznu.forest.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, UserService userService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public Result<String> login(@Valid @RequestBody LoginRequest request) {
        log.info("用户登录尝试: {}", request.getUsername());
        Result<String> result = authService.login(request.getUsername(), request.getPassword());
        if (result.getCode() == 200) {
            log.info("用户登录成功: {}", request.getUsername());
        } else {
            log.warn("用户登录失败: {} - {}", request.getUsername(), result.getMessage());
        }
        return result;
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterRequest request) {
        log.info("用户注册: {}", request.getUsername());
        Result<Void> result = authService.register(request.getUsername(), request.getPassword());
        if (result.getCode() == 200) {
            log.info("用户注册成功: {}", request.getUsername());
        } else {
            log.warn("用户注册失败: {} - {}", request.getUsername(), result.getMessage());
        }
        return result;
    }

    @GetMapping("/me")
    public Result<User> getCurrentUser(HttpServletRequest request) {
        String username = getCurrentUsername(request);
        log.debug("获取当前用户信息: {}", username);
        User user = userService.findByUsername(username);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        // 不返回密码
        user.setPassword(null);
        return Result.success(user);
    }

    @PutMapping("/profile")
    public Result<User> updateProfile(@Valid @RequestBody UpdateProfileRequest body,
                                      HttpServletRequest request) {
        String username = getCurrentUsername(request);
        log.info("更新个人信息: username={}", username);
        User user = userService.findByUsername(username);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        userService.updateProfile(user.getUserId(), body.getRealName(), body.getPhone());
        user.setRealName(body.getRealName());
        user.setPhone(body.getPhone());
        user.setPassword(null);
        return Result.success(user);
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest body,
                                       HttpServletRequest request) {
        String username = getCurrentUsername(request);
        log.info("修改密码: username={}", username);
        User user = userService.findByUsername(username);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        try {
            userService.changePassword(user.getUserId(), body.getOldPassword(), body.getNewPassword());
            return Result.ok();
        } catch (RuntimeException e) {
            log.warn("修改密码失败: {} - {}", username, e.getMessage());
            return Result.fail(e.getMessage());
        }
    }

    /** 从请求头中提取当前用户名 */
    private String getCurrentUsername(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.getUsernameFromToken(token);
    }
}
