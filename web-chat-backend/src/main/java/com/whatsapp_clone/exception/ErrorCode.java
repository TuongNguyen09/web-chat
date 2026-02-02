package com.whatsapp_clone.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import java.time.LocalDateTime;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {
    INVALID_QUANTITY(1001, "Invalid quantity", HttpStatus.INTERNAL_SERVER_ERROR),
    // --- USER ---
    USER_NOT_EXISTED(1001, "User not existed", HttpStatus.NOT_FOUND),
    USERNAME_EXISTED(1002, "Username has been existed", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1003, "Email or password is incorrect", HttpStatus.UNAUTHORIZED),
    EMAIL_EXISTED(1004, "Email has already been registered", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_MATCH(400, "Password and confirm password do not match", HttpStatus.BAD_REQUEST),
    // --- CHAT ---
    CHAT_NOT_EXISTED(2001, "Chat not existed", HttpStatus.NOT_FOUND),
    NOT_A_GROUP_CHAT(2002, "This is not a group chat", HttpStatus.BAD_REQUEST),
    NOT_GROUP_ADMIN(2003, "You are not an admin or creator of this group", HttpStatus.FORBIDDEN),
    USER_ALREADY_IN_GROUP(2004, "User already in group", HttpStatus.BAD_REQUEST),
    USER_NOT_IN_CHAT(2005, "You are not a member of this chat", HttpStatus.FORBIDDEN),
    GROUP_MUST_HAVE_MEMBERS(2006,"Group must have at least 3 members", HttpStatus.BAD_REQUEST),

    // --- MESSAGE ---
    MESSAGE_NOT_EXISTED(3001, "Message not existed", HttpStatus.NOT_FOUND),
    USER_NOT_PARTICIPANT(3002, "User is not a participant of this chat", HttpStatus.FORBIDDEN),
    MESSAGE_DELETE_DENIED(3003, "You are not allowed to delete this message", HttpStatus.FORBIDDEN),
    MESSAGE_EMPTY(3004, "Message content cannot be empty", HttpStatus.BAD_REQUEST),
    ATTACHMENT_REQUIRED(3005, "Attachment is required for this message type", HttpStatus.BAD_REQUEST),
    LINK_PREVIEW_REQUIRED(3006, "Link preview data is required", HttpStatus.BAD_REQUEST),
    STICKER_ID_REQUIRED(3007, "Sticker identifier is required", HttpStatus.BAD_REQUEST),
    MESSAGE_TYPE_UNSUPPORTED(3008, "Message type is not supported", HttpStatus.BAD_REQUEST),

    // --- PERMISSION / ACCESS ---
    ACCESS_DENIED(3001, "Access denied", HttpStatus.FORBIDDEN),
    INVALID_REQUEST(4001, "Invalid request", HttpStatus.BAD_REQUEST),
    USER_BLOCKED(4002, "User has been blocked", HttpStatus.FORBIDDEN),

    // --- GENERAL ---
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR);

    int code;
    String message;
    HttpStatusCode statusCode;
//    LocalDateTime timeStamp;

    ErrorCode(int code, String message, HttpStatusCode statusCode){
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
//        this.timeStamp = timeStamp;
    }
}
