package com.divid.backend.repository;

import com.divid.backend.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByUserIdAndDeviceId(String userId, String deviceId);

    @Transactional
    void deleteByUserIdAndDeviceId(String userId, String deviceId);

    @Transactional
    void deleteByUserId(String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < ?1")
    void deleteExpiredTokens(Instant now);
}
