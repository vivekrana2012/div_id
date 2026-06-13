package com.divid.backend.dto;

import com.divid.backend.model.User;

public record AuthResponse(String id, String username, String email, String displayName, String token, String refreshToken) {
    public static AuthResponse from(User u, String token) {
        return new AuthResponse(u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName(), token, null);
    }

    public static AuthResponse from(User u, String token, String refreshToken) {
        return new AuthResponse(u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName(), token, refreshToken);
    }
}
