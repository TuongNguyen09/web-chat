package com.whatsapp_clone.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)//trả về JSON không null
public class ApiResponse<T> {
    @Builder.Default
    int code = 1000;
    String message;
    T result;
}
