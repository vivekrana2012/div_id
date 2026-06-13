package com.divid.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtils {
    private final SecretKey key;
    private final long accessTokenExpiryMs;
    private final long refreshTokenExpiryMs;
    private final SecureRandom random = new SecureRandom();

    public JwtUtils(
            @Value("${divid.jwt.secret}") String secret,
            @Value("${divid.jwt.expiry-ms}") long expiryMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiryMs = 15 * 60 * 1000; // 15 minutes
        this.refreshTokenExpiryMs = expiryMs; // Falls back to config (1 day expected)
    }

    /**
     * Generate access token (15 min expiry)
     */
    public String generateAccessToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .signWith(key)
                .compact();
    }

    /**
     * Generate refresh token (raw token string, to be hashed before storage)
     * Returns a cryptographically secure random token.
     */
    public String generateRefreshTokenString() {
        byte[] randomBytes = new byte[32];
        random.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Generate JWT-based refresh token for validation (includes userId)
     * Expiry: 1 day (from config)
     */
    public String generateRefreshTokenJWT(String userId) {
        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiryMs))
                .signWith(key)
                .compact();
    }

    /**
     * Parse user ID from any JWT token (access or refresh)
     */
    public String parseUserId(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    /**
     * Validate JWT token (access or refresh)
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public long getAccessTokenExpiryMs() {
        return accessTokenExpiryMs;
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }
}
