package edu.hznu.forest.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long userId;
    private String username;
    private String password;
    private String role;
    private String realName;
    private String phone;
    private LocalDateTime createTime;
}
