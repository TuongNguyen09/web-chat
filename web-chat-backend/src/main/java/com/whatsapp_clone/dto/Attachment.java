package com.whatsapp_clone.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Attachment {
    String id;           // dùng để xoá/cập nhật
    String url;          // link S3 / CDN
    String fileName;
    String mimeType;
    long size;
    int width;           // optional
    int height;
    long durationMs;
}