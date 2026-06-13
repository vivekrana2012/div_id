package com.divid.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "device_id"})
})
public class RefreshToken {
    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "device_id", nullable = false, length = 100)
    private String deviceId;

    @Column(nullable = false, length = 500)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = Instant.now();
    }

    // Constructors
    public RefreshToken() {}

    public RefreshToken(String userId, String deviceId, String tokenHash, Instant expiresAt) {
        this.userId = userId;
        this.deviceId = deviceId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
