package edu.hznu.forest.service;

import edu.hznu.forest.entity.User;
import edu.hznu.forest.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class UserService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public User findByUsername(String username) {
        log.debug("查询用户: {}", username);
        return userMapper.findByUsername(username);
    }

    @Transactional
    public User register(String username, String password, String role) {
        log.info("注册用户: {}, role={}", username, role);
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role != null ? role : "USER");
        userMapper.insert(user);
        log.info("用户注册成功: id={}, username={}", user.getUserId(), username);
        return user;
    }

    public User findById(Long userId) {
        log.debug("查询用户 by id: {}", userId);
        return userMapper.findById(userId);
    }

    @Transactional
    public void updateProfile(Long userId, String realName, String phone) {
        log.info("更新用户信息: userId={}, realName={}, phone={}", userId, realName, phone);
        User user = new User();
        user.setUserId(userId);
        user.setRealName(realName);
        user.setPhone(phone);
        userMapper.updateUser(user);
        log.info("用户信息更新成功: userId={}", userId);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        log.info("修改密码: userId={}", userId);
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("原密码不正确");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updatePassword(user);
        log.info("密码修改成功: userId={}", userId);
    }
}
