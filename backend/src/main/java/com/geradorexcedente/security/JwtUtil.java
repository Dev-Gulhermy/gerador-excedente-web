package com.geradorexcedente.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import com.geradorexcedente.usuario.model.Usuario;

import org.springframework.beans.factory.annotation.Value;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    /*
     * =============================================
     * RESPONSABILIDADES:
     * - Gerar tokens (access + refresh)
     * - Validar token
     * - Extrair email
     * =============================================
     */

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    // 🔐 chave segura
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // =============================================
    // 🔐 ACCESS TOKEN
    // =============================================
    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                // 👤 IDENTIDADE PRINCIPAL
                .setSubject(usuario.getEmail())
                // 🔥 TOKEN VERSION
                .claim("tokenVersion", usuario.getTokenVersion())
                // ⏰ DATA EMISSÃO
                .setIssuedAt(new Date())
                // ⏰ EXPIRAÇÃO
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                // 🔐 ASSINATURA
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =============================================
    // 🔁 REFRESH TOKEN
    // =============================================
    public String generateRefreshToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getEmail())
                .claim("tokenVersion", usuario.getTokenVersion())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // =============================================
    // 📌 EXTRAIR EMAIL
    // =============================================
    public String extrairEmail(String token) {
        return getClaims(token).getSubject();
    }

    // =============================================
    // 📌 EXTRAIR TOKEN VERSION
    // =============================================
    public Integer extrairTokenVersion(String token) {
        Claims claims = getClaims(token);
        return claims.get("tokenVersion", Integer.class);
    }

    // =============================================
    // 📌 EXTRAIR CLAIMS
    // =============================================
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // =============================================
    // ✅ VALIDAR TOKEN
    // =============================================
    public boolean validarToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}