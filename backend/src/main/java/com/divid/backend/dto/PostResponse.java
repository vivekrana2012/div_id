package com.divid.backend.dto;

import com.divid.backend.model.Post;
import java.time.Instant;

public record PostResponse(
    String id,
    String title,
    String body,
    String notes,
    String status,
    Instant createdAt,
    Instant updatedAt,
    AuthorInfo author
) {
    public record AuthorInfo(String id, String username, String displayName) {}

    public static PostResponse from(Post p) {
        return new PostResponse(
            p.getId(), p.getTitle(), p.getBody(), p.getNotes(), p.getStatus(),
            p.getCreatedAt(), p.getUpdatedAt(),
            new AuthorInfo(p.getAuthor().getId(), p.getAuthor().getUsername(), p.getAuthor().getDisplayName())
        );
    }

    public PostResponse withoutNotes() {
        return new PostResponse(id, title, body, null, status, createdAt, updatedAt, author);
    }
}
