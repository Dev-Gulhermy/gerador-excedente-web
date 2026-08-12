package com.geradorexcedente.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;

import com.geradorexcedente.auth.dto.LoginRequestDTO;
import com.geradorexcedente.auth.dto.LoginResponseDTO;
import com.geradorexcedente.auth.dto.UsuarioLogadoDTO;
import com.geradorexcedente.auth.response.AuthResponse;
import com.geradorexcedente.auth.service.AuthService;
import com.geradorexcedente.security.CookieConfig;
import com.geradorexcedente.usuario.dao.UsuarioDAO;
import com.geradorexcedente.usuario.model.Usuario;
import com.geradorexcedente.usuario.service.UsuarioService;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;

/**
 * ================================================
 * 🔐 AUTH CONTROLLER
 * ================================================
 * 
 * Responsabilidade: Gerenciar autenticação e sessões
 * 
 * Fluxo:
 * 1. Login: email + senha → retorna tokens via HttpOnly cookies
 * 2. Logout: invalida tokens + marca como offline
 * 3. Refresh: renova access token
 * 4. Me: retorna dados do usuário atual
 * 
 * Segurança:
 * - Tokens armazenados em HttpOnly cookies (não JS)
 * - CORS permite credenciais
 * - SameSite configurado por ambiente
 * (application-dev / application-prod)
 * 
 * ================================================
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

        private final UsuarioService usuarioService;
        private final AuthService authService;
        private final UsuarioDAO usuarioDAO;
        private final CookieConfig cookieConfig;

        public AuthController(
                        UsuarioService usuarioService,
                        AuthService authService,
                        UsuarioDAO usuarioDAO,
                        CookieConfig cookieConfig) {

                this.usuarioService = usuarioService;
                this.authService = authService;
                this.usuarioDAO = usuarioDAO;
                this.cookieConfig = cookieConfig;
        }

        // ================================================
        // 🔐 LOGIN
        // ================================================

        /**
         * Autentica usuário e envia tokens via HttpOnly cookies
         * 
         * @param request  Email e senha
         * @param response HttpServletResponse para set cookies
         * @return JSON com nome e perfil (SEM tokens)
         * 
         *         Cookies enviados:
         *         - token: JWT access token (1 hora)
         *         - refreshToken: Refresh token (7 dias)
         * 
         *         Ambos com flags: HttpOnly, Secure, SameSite=Strict
         */
        @PostMapping("/login")
        public ResponseEntity<?> login(
                        @RequestBody LoginRequestDTO request,
                        HttpServletResponse response) {

                LoginResponseDTO loginResp = usuarioService.autenticar(
                                request.getEmail(),
                                request.getSenha());

                if (loginResp == null) {
                        LoginResponseDTO erro = new LoginResponseDTO();
                        erro.setMensagem("Credenciais inválidas");
                        return ResponseEntity.status(401).body(erro);
                }

                // ================================================
                // 🟢 MARCA USUÁRIO COMO ONLINE
                // ================================================
                usuarioDAO.setOnline(request.getEmail());

                // ================================================
                // 🍪 ENVIA TOKENS VIA HTTPONLY COOKIES
                // ================================================

                // 🔐 Access Token (1 hora)
                response.addHeader(
                                HttpHeaders.SET_COOKIE,
                                cookieConfig.createAccessTokenCookie(
                                                loginResp.getToken())
                                                .toString());
                // log temporário ------ NÃO SUBIR PARA PROD
                System.out.println(
                                cookieConfig.createAccessTokenCookie(
                                                loginResp.getToken())
                                                .toString());

                // 🔁 Refresh Token (7 dias) 
                response.addHeader(
                                HttpHeaders.SET_COOKIE,
                                cookieConfig.createRefreshTokenCookie(
                                                loginResp.getRefreshToken())
                                                .toString());

                // log temporário ------- NÃO SUBIR PARA PROD
                System.out.println(
                                cookieConfig.createRefreshTokenCookie(
                                                loginResp.getRefreshToken())
                                                .toString());

                // ================================================
                // 📦 RESPOSTA (SEM TOKENS)
                // ================================================
                // Retorna apenas metadados do usuário
                // Tokens estão nos cookies (automaticamente inclusos)

                LoginResponseDTO resposta = new LoginResponseDTO(
                                null, // token (não inclui no JSON)
                                null, // refreshToken (não inclui no JSON)
                                loginResp.getNome(),
                                loginResp.getPerfil());

                return ResponseEntity.ok(resposta);
        }

        // ================================================
        // 🚪 LOGOUT
        // ================================================

        /**
         * Faz logout do usuário
         * 
         * Ações:
         * - Marca usuário como offline
         * - Invalida sessão
         * - Limpa cookies
         */
        @PostMapping("/logout")
        public ResponseEntity<Void> logout(
                        Authentication auth,
                        HttpServletResponse response) {

                String email = auth.getName();

                usuarioService.logout(email);

                // ================================================
                // 🧹 LIMPA COOKIES
                // ================================================
                // Envia cookies com Max-Age=0 para removê-los

                response.addHeader(
                                HttpHeaders.SET_COOKIE,
                                cookieConfig.clearAccessTokenCookie()
                                                .toString());

                response.addHeader(
                                HttpHeaders.SET_COOKIE,
                                cookieConfig.clearRefreshTokenCookie()
                                                .toString());

                return ResponseEntity.ok().build();
        }

        // ================================================
        // 🔁 REFRESH TOKEN
        // ================================================

        /**
         * Renova o access token
         *
         * Lê o refreshToken diretamente do
         * HttpOnly Cookie.
         *
         * Não depende de Authorization Header.
         */
        @PostMapping("/refresh")
        public ResponseEntity<AuthResponse> refresh(

                        @CookieValue(value = "refreshToken", required = false) String refreshToken,

                        HttpServletResponse response) {

                // ================================================
                // 🔒 VALIDA COOKIE
                // ================================================
                if (refreshToken == null || refreshToken.isBlank()) {
                        return ResponseEntity.status(401).build();
                }

                // ================================================
                // 🔁 GERA NOVO ACCESS TOKEN
                // ================================================
                AuthResponse authResp = authService.refreshToken(refreshToken);

                // ================================================
                // 🔒 REFRESH TOKEN INVÁLIDO
                // ================================================
                if (authResp == null || authResp.getToken() == null) {
                        return ResponseEntity.status(401).build();
                }

                // ================================================
                // 🍪 ENVIA NOVO ACCESS TOKEN VIA COOKIE
                // ================================================
                response.addHeader(
                                HttpHeaders.SET_COOKIE,
                                cookieConfig.createAccessTokenCookie(
                                                authResp.getToken())
                                                .toString());

                // ================================================
                // 📦 RESPOSTA SEM TOKENS
                // ================================================
                return ResponseEntity.ok(
                                new AuthResponse(null, null));
        }

        // ==========================================
        // 👤 USUÁRIO LOGADO
        // ==========================================
        @GetMapping("/me")
        public ResponseEntity<UsuarioLogadoDTO> usuarioLogado(Authentication auth) {

                Object principal = auth.getPrincipal();

                if (principal instanceof Usuario u) {
                        return ResponseEntity.ok(
                                        new UsuarioLogadoDTO(
                                                        u.getEmail(),
                                                        u.getNome(),
                                                        u.getPerfil().name()));
                }

                throw new RuntimeException("Tipo de usuário inválido");
        }

        /**
         * ================================================
         * 🔍 CHECK AUTH ENDPOINT
         * ================================================
         * 
         * Verifica se o usuário está autenticado via cookie HttpOnly.
         * 
         * Fluxo:
         * 1. Se autenticado → retorna 200 OK
         * 2. Se não autenticado → o JwtFilter já bloqueou antes (401)
         * 
         * Obs: Cookies HttpOnly são automaticamente enviados pelo navegador
         */
        @GetMapping("/check-auth")
        public ResponseEntity<Void> checkAuth(Authentication auth) {
                // Log para depuração (remova em produção)
                System.out.println("[DEBUG] check-auth chamado por: " +
                                (auth != null ? auth.getName() : "null"));

                // Se chegou aqui, o JwtFilter já validou o token
                return ResponseEntity.ok().build();
        }
}