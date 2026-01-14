package com.whatsapp_clone.configuration;

import com.nimbusds.jwt.SignedJWT;

import com.whatsapp_clone.service.AuthService;
import com.whatsapp_clone.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthService authService;
    private final UserService userService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry){
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry){
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/group","/user");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                // Chỉ xử lý khi client CONNECT
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {

                    List<String> authHeaders = accessor.getNativeHeader("Authorization");
                    String bearer = (authHeaders != null && !authHeaders.isEmpty())
                            ? authHeaders.get(0)
                            : null;

                    String token = extractToken(bearer);
                    if (token == null) {
                        throw new MessagingException("Missing auth token");
                    }

                    try {
                        SignedJWT jwt = authService.verifyToken(token, "access");
                        String email = jwt.getJWTClaimsSet().getSubject();

                        UserDetails userDetails = userService.loadUserByUsername(email);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        accessor.setUser(authentication);

                    } catch (Exception e) {
                        throw new MessagingException("Invalid auth token", e);
                    }
                }
                return message;
            }

            private String extractToken(String header) {
                if (header == null) return null;
                if (header.startsWith("Bearer ")) {
                    return header.substring(7);
                }
                return header;
            }
        });
    }
}