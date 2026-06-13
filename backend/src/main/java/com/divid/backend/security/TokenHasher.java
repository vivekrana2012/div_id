package com.divid.backend.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class TokenHasher {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String hash(String token) {
        return encoder.encode(token);
    }

    public boolean matches(String token, String hash) {
        return encoder.matches(token, hash);
    }
}
