package com.whatsapp_clone.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.*;

@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    String id;

    @Field("full_name")
    String fullName;

    @Field("email")
    String email;

    @Field("phone")
    String phone;

    @Field("profile_picture")
    @JsonProperty("profilePicture")
    String profilePicture;

    @Field("password")
    String password;

    @Field("blocked_list")
    @JsonProperty("blockedList")
    List<String> blockedList;
}