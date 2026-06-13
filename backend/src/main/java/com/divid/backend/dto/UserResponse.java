package com.divid.backend.dto;

import com.divid.backend.model.User;

public record UserResponse(String id, String username, String email, String displayName) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName());
    }
}
