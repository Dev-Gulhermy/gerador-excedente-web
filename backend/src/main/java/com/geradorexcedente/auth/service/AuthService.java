package com.geradorexcedente.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.geradorexcedente.auth.response.AuthResponse;
import com.geradorexcedente.security.JwtUtil;
import com.geradorexcedente.usuario.model.Usuario;
import com.geradorexcedente.usuario.service.UsuarioService;

@Service
public class AuthService {

    /*
     * ==========================================
     * RESPONSABILIDADES:
     * - Refresh token
     * - Validar refresh token
     * - Gerar novo access token
     * ==========================================
     */

    private final JwtUtil jwtUtil;

    private final UsuarioService usuarioService;

    // ==========================================
    // 🔧 INJEÇÃO VIA CONSTRUTOR
    // ==========================================
    public AuthService(
            JwtUtil jwtUtil,
            UsuarioService usuarioService) {

        this.jwtUtil = jwtUtil;
        this.usuarioService = usuarioService;
    }

    // ==========================================
    // 🔁 REFRESH TOKEN
    // ==========================================
    public AuthResponse refreshToken(String refreshToken) {

        // ======================================
        // 🔐 VALIDA ASSINATURA JWT
        // ======================================
        if (!jwtUtil.validarToken(refreshToken)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token inválido");
        }

        // ======================================
        // 📌 EXTRAI EMAIL
        // ======================================
        String email = jwtUtil.extrairEmail(refreshToken);

        // ======================================
        // 🔍 BUSCA USUÁRIO NO BANCO
        // ======================================
        Usuario usuario = usuarioService.buscarPorEmail(email);

        // ======================================
        // 🔐 GERA NOVO ACCESS TOKEN
        // ======================================
        String newAccessToken = jwtUtil.generateToken(usuario);

        // ======================================
        // ✅ RETORNO
        // ======================================
        return new AuthResponse(
                newAccessToken,
                refreshToken);
    }
}