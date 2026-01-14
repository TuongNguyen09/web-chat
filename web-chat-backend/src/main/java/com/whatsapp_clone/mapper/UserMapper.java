package com.whatsapp_clone.mapper;

import com.whatsapp_clone.dto.request.CreateUserRequest;
import com.whatsapp_clone.dto.request.UpdateUserRequest;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.model.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(CreateUserRequest request);

    @Mapping(target = "profilePicture", source = "profilePicture")
    UserResponse toUserResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUser(UpdateUserRequest request, @MappingTarget User user);
}