package com.divid.backend.service;

import com.divid.backend.model.RefreshToken;
import com.divid.backend.repository.RefreshTokenRepository;
import com.divid.backend.security.JwtUtils;
import com.divid.backend.security.TokenHasher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenHasher tokenHasher;
    private final JwtUtils jwtUtils;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                              TokenHasher tokenHasher,
                              JwtUtils jwtUtils) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenHasher = tokenHasher;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Create a new refresh token for a device
     * Automatically replaces any existing token for this (userId, deviceId) pair
     * Returns the unhashed token string (for client to store)
     */
    @Transactional
    public String createRefreshTokenString(String userId, String deviceId) {
        // Remove old token if it exists (single token per device)
        refreshTokenRepository.deleteByUserIdAndDeviceId(userId, deviceId);
        refreshTokenRepository.flush();

        // Generate new refresh token
        String tokenString = jwtUtils.generateRefreshTokenString();
        String tokenHash = tokenHasher.hash(tokenString);

        // Token expires in 1 day
        Instant expiresAt = Instant.now().plus(1, ChronoUnit.DAYS);

        RefreshToken refreshToken = new RefreshToken(userId, deviceId, tokenHash, expiresAt);
        refreshTokenRepository.save(refreshToken);

        return tokenString; // Return unhashed token for client storage
    }

    /**
     * Validate and consume a refresh token (single-use)
     * Returns a map with accessToken and refreshToken on success, null on failure
     */
    @Transactional
    public Map<String, String> refreshAccessToken(String userId, String deviceId, String tokenString) {
        // Find existing refresh token
        RefreshToken refreshToken = refreshTokenRepository
                .findByUserIdAndDeviceId(userId, deviceId)
                .orElse(null);

        if (refreshToken == null) {
            return null; // Token not found (already used or never existed)
        }

        // Check expiry
        if (Instant.now().isAfter(refreshToken.getExpiresAt())) {
            refreshTokenRepository.delete(refreshToken);
            return null; // Token expired
        }

        // Validate token hash (constant-time comparison)
        if (!tokenHasher.matches(tokenString, refreshToken.getTokenHash())) {
            return null; // Token invalid
        }

        // Token is valid: delete it (single-use enforcement)
        refreshTokenRepository.delete(refreshToken);

        // Generate new access token and new refresh token
        String newAccessToken = jwtUtils.generateAccessToken(userId);
        String newRefreshToken = createRefreshTokenString(userId, deviceId);

        return Map.of(
            "accessToken", newAccessToken,
            "refreshToken", newRefreshToken
        );
    }

    /**
     * Logout: delete all refresh tokens for a user (all devices)
     */
    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    /**
     * Logout from specific device
     */
    @Transactional
    public void logoutDevice(String userId, String deviceId) {
        refreshTokenRepository.deleteByUserIdAndDeviceId(userId, deviceId);
    }

    /**
     * Scheduled task to clean up expired tokens (runs daily at 2 AM)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
    }
}
