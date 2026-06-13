package com.divid.backend.controller;

import com.divid.backend.dto.AuthRequest;
import com.divid.backend.dto.AuthResponse;
import com.divid.backend.dto.RegisterRequest;
import com.divid.backend.dto.UserResponse;
import com.divid.backend.model.User;
import com.divid.backend.service.AuthService;
import com.divid.backend.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String DEFAULT_DEVICE_ID = "web";

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.registerWithToken(req);
        
        // Set refresh token as HttpOnly cookie
        Cookie refreshCookie = new Cookie("divid_refresh_token", authResponse.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(86400); // 1 day
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
        
        // Set access token as HttpOnly cookie
        Cookie accessCookie = new Cookie("divid_token", authResponse.token());
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 minutes
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        // Set user ID cookie (needed for refresh after access token expires)
        Cookie userIdCookie = new Cookie("divid_user_id", authResponse.id());
        userIdCookie.setHttpOnly(true);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge(86400); // same as refresh token
        userIdCookie.setAttribute("SameSite", "Lax");
        response.addCookie(userIdCookie);
        
        return ResponseEntity.status(201).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody AuthRequest req,
            HttpServletResponse response) {
        String accessToken = authService.login(req.username(), req.password());
        User user = authService.getUserByUsername(req.username());
        
        // Create refresh token
        String refreshToken = refreshTokenService.createRefreshTokenString(user.getId(), DEFAULT_DEVICE_ID);
        
        // Set refresh token as HttpOnly cookie
        Cookie refreshCookie = new Cookie("divid_refresh_token", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(86400); // 1 day
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
        
        // Set access token as HttpOnly cookie
        Cookie accessCookie = new Cookie("divid_token", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 minutes
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        // Set user ID cookie (needed for refresh after access token expires)
        Cookie userIdCookie = new Cookie("divid_user_id", user.getId());
        userIdCookie.setHttpOnly(true);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge(86400); // same as refresh token
        userIdCookie.setAttribute("SameSite", "Lax");
        response.addCookie(userIdCookie);
        
        return ResponseEntity.ok(AuthResponse.from(user, accessToken, refreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        Map<String, String> safeBody = body != null ? body : Map.of();
        
        // Get refresh token from body or cookie
        String refreshToken = safeBody.get("refreshToken");
        if (refreshToken == null) {
            refreshToken = getCookieValue(request, "divid_refresh_token");
        }
        
        String deviceId = safeBody.getOrDefault("deviceId", DEFAULT_DEVICE_ID);
        
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token required"));
        }
        
        // Get user ID from authenticated principal, body, or cookie
        String userId = null;
        if (user != null) {
            userId = user.getId();
        } else if (safeBody.containsKey("userId")) {
            userId = safeBody.get("userId");
        } else {
            userId = getCookieValue(request, "divid_user_id");
        }
        
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        // Validate and refresh
        Map<String, String> tokens = refreshTokenService.refreshAccessToken(userId, deviceId, refreshToken);
        
        if (tokens == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired refresh token"));
        }
        
        String newAccessToken = tokens.get("accessToken");
        String newRefreshToken = tokens.get("refreshToken");
        
        // Set both cookies
        Cookie accessCookie = new Cookie("divid_token", newAccessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900); // 15 minutes
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);
        
        Cookie refreshCookie = new Cookie("divid_refresh_token", newRefreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(86400); // 1 day
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);

        // Refresh user ID cookie expiry
        Cookie userIdCookie = new Cookie("divid_user_id", userId);
        userIdCookie.setHttpOnly(true);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge(86400);
        response.addCookie(userIdCookie);
        
        return ResponseEntity.ok(Map.of(
            "accessToken", newAccessToken,
            "refreshToken", newRefreshToken
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal User user,
            HttpServletResponse response) {
        
        if (user != null) {
            refreshTokenService.logout(user.getId());
        }
        
        // Clear cookies
        Cookie accessCookie = new Cookie("divid_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);
        
        Cookie refreshCookie = new Cookie("divid_refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);

        Cookie userIdCookie = new Cookie("divid_user_id", "");
        userIdCookie.setHttpOnly(true);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge(0);
        response.addCookie(userIdCookie);
        
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
