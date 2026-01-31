package com.whatsapp_clone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whatsapp_clone.dto.request.CreateUserRequest;
import com.whatsapp_clone.dto.request.UpdateUserRequest;
import com.whatsapp_clone.dto.response.UserResponse;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import com.whatsapp_clone.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
        "jwt.refreshable-duration=7200",
        "app.cookie.secure=false"
})
class UserControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

        @MockBean
        UserService userService;

    CreateUserRequest createRequest;
    UpdateUserRequest updateRequest;
    UserResponse userResponse;

    @BeforeEach
    void setUp() {
        createRequest = CreateUserRequest.builder()
                .fullname("John Doe")
                .email("john@example.com")
                .phone("0912345678")
                .password("password")
                .build();

        updateRequest = UpdateUserRequest.builder()
                .fullName("John Updated")
                .email("john@example.com")
                .phone("0912345678")
                .password("newpass")
                .profilePicture("pic.png")
                .build();

        userResponse = UserResponse.builder()
                .id("u1")
                .fullName("John Doe")
                .email("john@example.com")
                .phone("0912345678")
                .profilePicture(null)
                .build();
    }

    @Test
    void createUser_success() throws Exception {
        when(userService.createUser(any())).thenReturn(userResponse);

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("u1"));
    }

    @Test
    void createUser_emailExists_shouldReturnBadRequest() throws Exception {
        when(userService.createUser(any()))
                .thenThrow(new AppException(ErrorCode.EMAIL_EXISTED));

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.EMAIL_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.EMAIL_EXISTED.getMessage()));
    }

    @Test
    void updateUser_success() throws Exception {
        when(userService.updateUser(anyString(), any())).thenReturn(userResponse.toBuilder().fullName("John Updated").build());

        mockMvc.perform(patch("/users/u1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.fullName").value("John Updated"));
    }

    @Test
    void updateUser_notFound_shouldReturnNotFound() throws Exception {
        when(userService.updateUser(anyString(), any()))
                .thenThrow(new AppException(ErrorCode.USER_NOT_EXISTED));

        mockMvc.perform(patch("/users/u404")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_EXISTED.getMessage()));
    }

    @Test
    void deleteUser_success() throws Exception {
        doNothing().when(userService).deleteUser("u1");

        mockMvc.perform(delete("/users/u1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").value("User has been deleted."));
    }

    @Test
    void deleteUser_notFound_shouldReturnNotFound() throws Exception {
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.USER_NOT_EXISTED))
                .when(userService).deleteUser("u404");

        mockMvc.perform(delete("/users/u404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_EXISTED.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_EXISTED.getMessage()));
    }

    @Test
    void getAllUsers_success() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value("u1"));
    }

    @Test
    void searchUsers_success() throws Exception {
        when(userService.searchUser("john")).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/users/search").param("name", "john"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].id").value("u1"));
    }

    @Test
    void getMyProfile_success() throws Exception {
        when(userService.getMyProfile()).thenReturn(userResponse);

        mockMvc.perform(get("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.email").value("john@example.com"));
    }
}
