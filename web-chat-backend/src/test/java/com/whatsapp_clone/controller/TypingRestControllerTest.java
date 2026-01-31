package com.whatsapp_clone.controller;

import com.whatsapp_clone.dto.TypingEvent;
import com.whatsapp_clone.model.User;
import com.whatsapp_clone.service.TypingIndicatorService;
import com.whatsapp_clone.service.UserService;
import com.whatsapp_clone.exception.AppException;
import com.whatsapp_clone.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TypingRestController.class)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
	"jwt.refreshable-duration=7200",
	"app.cookie.secure=false"
})
class TypingRestControllerTest {

    @Autowired
    MockMvc mockMvc;

	@MockBean
	TypingIndicatorService typingIndicatorService;

	@MockBean
	UserService userService;

    User currentUser;
    TypingEvent event;

    @BeforeEach
    void setUp() {
	currentUser = User.builder()
		.id("u1")
		.fullName("Alice")
		.email("alice@example.com")
		.build();

	event = TypingEvent.builder()
		.chatId("c1")
		.userId("u1")
		.displayName("Alice")
		.build();
    }

    @Test
    void getActiveTypers_success() throws Exception {
	when(userService.getCurrentUserEntity()).thenReturn(currentUser);
	when(typingIndicatorService.getActiveTypers("c1", currentUser))
		.thenReturn(List.of(event));

	mockMvc.perform(get("/typing/c1"))
		.andExpect(status().isOk())
		.andExpect(jsonPath("$.code").value(1000))
		.andExpect(jsonPath("$.result", hasSize(1)))
		.andExpect(jsonPath("$.result[0].userId").value("u1"));
    }

    @Test
    void getActiveTypers_notParticipant_shouldReturnForbidden() throws Exception {
	when(userService.getCurrentUserEntity()).thenReturn(currentUser);
	when(typingIndicatorService.getActiveTypers("c1", currentUser))
		.thenThrow(new AppException(ErrorCode.USER_NOT_PARTICIPANT));

	mockMvc.perform(get("/typing/c1"))
		.andExpect(status().isForbidden())
		.andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_PARTICIPANT.getCode()))
		.andExpect(jsonPath("$.message").value(ErrorCode.USER_NOT_PARTICIPANT.getMessage()));
    }
}