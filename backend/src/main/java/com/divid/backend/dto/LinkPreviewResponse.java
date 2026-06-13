package com.divid.backend.dto;

import com.divid.backend.model.LinkMetadata;

public record LinkPreviewResponse(
        String url,
        String title,
        String description,
        String imageUrl,
        String siteName
) {
    public static LinkPreviewResponse from(LinkMetadata m) {
        return new LinkPreviewResponse(m.getUrl(), m.getTitle(), m.getDescription(), m.getImageUrl(), m.getSiteName());
    }
}
