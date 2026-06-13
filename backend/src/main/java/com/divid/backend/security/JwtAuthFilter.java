package com.divid.backend.security;

import com.divid.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtils jwtUtils, UserRepository userRepository) {
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String token = null;

        // Check Authorization: Bearer header first (mobile clients)
        String authHeader = req.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // Fall back to cookie (web clients)
        if (token == null && req.getCookies() != null) {
            for (Cookie c : req.getCookies()) {
                if ("divid_token".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String userId = jwtUtils.parseUserId(token);
                userRepository.findById(userId).ifPresent(user -> {
                    var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            } catch (Exception ignored) {}
        }
        chain.doFilter(req, res);
    }
}
