package com.whatsapp_clone.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LinkPreview {
    String url;
    String title;
    String description;
    String thumbnailUrl;
}