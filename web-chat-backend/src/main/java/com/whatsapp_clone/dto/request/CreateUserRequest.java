package com.whatsapp_clone.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserRequest {
    String password;
    String fullname;
//    @EmailConstraint(message = "INVALID_EMAIL")
    String email;
    String phone;
}
