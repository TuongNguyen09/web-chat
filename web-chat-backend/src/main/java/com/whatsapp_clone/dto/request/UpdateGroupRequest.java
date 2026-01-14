package com.whatsapp_clone.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateGroupRequest {
    String newName;    // optional
    String chatImage;  // optional
}