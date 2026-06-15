package edu.hznu.forest.mapper;

import org.apache.ibatis.annotations.Mapper;
import edu.hznu.forest.entity.User;

@Mapper
public interface UserMapper {

    User findByUsername(String username);

    User findById(Long userId);

    int insert(User user);

    int updateUser(User user);

    int updatePassword(User user);
}
