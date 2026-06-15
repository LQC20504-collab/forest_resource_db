package edu.hznu.forest.service;

import edu.hznu.forest.common.Result;
import edu.hznu.forest.config.JwtUtil;
import edu.hznu.forest.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Result<String> login(String username, String password) {
        log.info("用户登录: {}", username);
        User user = userService.findByUsername(username);
        if (user == null) {
            log.warn("登录失败 - 用户不存在: {}", username);
            return Result.error(401, "用户名或密码错误");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("登录失败 - 密码错误: {}", username);
            return Result.error(401, "用户名或密码错误");
        }
        String token = jwtUtil.generateToken(username);
        log.info("登录成功: {}", username);
        return Result.success(token);
    }

    @Transactional
    public Result<Void> register(String username, String password) {
        log.info("用户注册: {}", username);
        User existing = userService.findByUsername(username);
        if (existing != null) {
            log.warn("注册失败 - 用户名已存在: {}", username);
            return Result.error(400, "用户名已存在");
        }
        userService.register(username, password, "USER");
        log.info("注册成功: {}", username);
        return Result.ok();
    }
}
