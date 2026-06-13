package com.divid.backend.service;

import com.divid.backend.dto.AuthResponse;
import com.divid.backend.dto.RegisterRequest;
import com.divid.backend.dto.UserResponse;
import com.divid.backend.model.User;
import com.divid.backend.repository.UserRepository;
import com.divid.backend.security.JwtUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;
    private static final String DEFAULT_DEVICE_ID = "web";

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepo, PasswordEncoder encoder, JwtUtils jwtUtils,
                       RefreshTokenService refreshTokenService) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepo.existsByUsername(req.username()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepo.existsByEmail(req.email()))
            throw new IllegalArgumentException("Email already registered");

        User user = new User();
        user.setUsername(req.username());
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        return UserResponse.from(userRepo.save(user));
    }

    @Transactional
    public AuthResponse registerWithToken(RegisterRequest req) {
        if (userRepo.existsByUsername(req.username()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepo.existsByEmail(req.email()))
            throw new IllegalArgumentException("Email already registered");

        User user = new User();
        user.setUsername(req.username());
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        User saved = userRepo.save(user);
        
        // Generate access token and refresh token
        String accessToken = jwtUtils.generateAccessToken(saved.getId());
        String refreshToken = refreshTokenService.createRefreshTokenString(saved.getId(), DEFAULT_DEVICE_ID);
        
        return AuthResponse.from(saved, accessToken, refreshToken);
    }

    @Transactional
    public String login(String username, String password) {
        User user = userRepo.findByUsername(username)
                .orElseGet(() -> {
                    encoder.encode(password); // timing mitigation
                    return null;
                });

        if (user == null) throw new IllegalArgumentException("Invalid credentials");

        if (user.getLockoutUntil() != null && Instant.now().isBefore(user.getLockoutUntil())) {
            throw new IllegalStateException("Account locked. Try again later.");
        }

        if (!encoder.matches(password, user.getPasswordHash())) {
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);
            if (attempts >= MAX_ATTEMPTS) {
                user.setLockoutUntil(Instant.now().plus(LOCKOUT_MINUTES, ChronoUnit.MINUTES));
            }
            userRepo.save(user);
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setFailedAttempts(0);
        user.setLockoutUntil(null);
        userRepo.save(user);
        
        // Generate tokens
        String accessToken = jwtUtils.generateAccessToken(user.getId());
        String refreshToken = refreshTokenService.createRefreshTokenString(user.getId(), DEFAULT_DEVICE_ID);
        
        // Return access token (refresh token is set in cookie by controller)
        return accessToken;
    }

    public UserResponse getUserResponseByUsername(String username) {
        return userRepo.findByUsername(username).map(UserResponse::from)
                .orElseThrow();
    }

    public User getUserByUsername(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }
}
