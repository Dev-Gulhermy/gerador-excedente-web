package com.geradorexcedente.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieConfig {

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @Value("${app.cookie.secure}")
    private boolean secure;

    public char[] createRefr;

    public ResponseCookie createAccessTokenCookie(String token) {

        return ResponseCookie
                .from("token", token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(3600)
                .build();
    }

    public ResponseCookie createRefreshTokenCookie(String refreshToken) {

        return ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(604800)
                .build();
    }

    public ResponseCookie clearAccessTokenCookie() {

        return ResponseCookie
                .from("token", "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
    }

    public ResponseCookie clearRefreshTokenCookie() {

        return ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
    }
}
