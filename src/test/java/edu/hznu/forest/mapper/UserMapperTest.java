package edu.hznu.forest.mapper;

import edu.hznu.forest.entity.User;
import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis Mapper tests for {@link UserMapper}.
 * Uses H2 in-memory database in MySQL compatibility mode.
 */
@MybatisTest
@Sql(scripts = "/schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
@Transactional
class UserMapperTest {

    @Autowired
    private UserMapper userMapper;

    @Test
    void findByUsername_exists_shouldReturnUser() {
        // Arrange
        User user = new User();
        user.setUsername("forest_admin");
        user.setPassword("$2a$10$encrypted");
        user.setRole("admin");
        user.setRealName("Forest Admin");
        user.setPhone("13800000001");
        userMapper.insert(user);

        // Act
        User found = userMapper.findByUsername("forest_admin");

        // Assert
        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo("forest_admin");
        assertThat(found.getPassword()).isEqualTo("$2a$10$encrypted");
        assertThat(found.getRole()).isEqualTo("admin");
        assertThat(found.getRealName()).isEqualTo("Forest Admin");
        assertThat(found.getPhone()).isEqualTo("13800000001");
    }

    @Test
    void findByUsername_notExists_shouldReturnNull() {
        // Act
        User found = userMapper.findByUsername("nonexistent_user");

        // Assert
        assertThat(found).isNull();
    }
}
