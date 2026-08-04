package com.geradorexcedente.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.web.filter.OncePerRequestFilter;

import com.geradorexcedente.usuario.model.Usuario;
import com.geradorexcedente.usuario.service.UsuarioService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

        private final JwtUtil jwtUtil;

        private final UsuarioService usuarioService;

        private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

        JwtFilter(UsuarioService usuarioService, JwtUtil jwtUtil) {
                this.usuarioService = usuarioService;
                this.jwtUtil = jwtUtil;
        }

        // =============================================
        // 🔓 ROTAS PÚBLICAS
        // =============================================
        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {

                String path = request.getServletPath();

                return path.startsWith("/auth/login")
                                || path.startsWith("/auth/refresh")
                                || (path.equals("/usuario") && request.getMethod().equals("POST"))
                                || path.startsWith("/health")
                                || path.startsWith("/warmup");
        }

        // =============================================
        // 🔐 FILTRO JWT
        // =============================================
        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain)
                        throws ServletException, IOException {

                // =============================================
                // 🍪 BUSCA ACCESS TOKEN NOS COOKIES
                // =============================================
                String token = null;

                Cookie[] cookies = request.getCookies();

                if (cookies != null) {

                        for (Cookie cookie : cookies) {

                                if ("token".equals(cookie.getName())) {

                                        token = cookie.getValue();

                                        break;
                                }
                        }
                }

                // =============================================
                // 🔍 COOKIE NÃO ENCONTRADO
                // =============================================
                if (token == null) {

                        log.debug(
                                        "Nenhum access token encontrado para [{} {}]",
                                        request.getMethod(),
                                        request.getRequestURI());

                        filterChain.doFilter(request, response);
                        return;
                }

                // =============================================
                // 🔍 TOKEN INVÁLIDO
                // =============================================
                if (!jwtUtil.validarToken(token)) {

                        log.warn(
                                        "Token JWT inválido para [{} {}]",
                                        request.getMethod(),
                                        request.getRequestURI());

                        filterChain.doFilter(request, response);
                        return;
                }

                try {

                        // =============================================
                        // 📌 EXTRAI EMAIL DO TOKEN
                        // =============================================
                        String email = jwtUtil.extrairEmail(token);

                        // =============================================
                        // 👤 BUSCA USUÁRIO
                        // =============================================
                        Usuario usuario = usuarioService.buscarPorEmail(email);

                        // =============================================
                        // ⚠️ USUÁRIO NÃO ENCONTRADO
                        // =============================================
                        if (usuario == null) {

                                log.warn(
                                                "Usuário do token não encontrado: {}",
                                                email);

                                filterChain.doFilter(request, response);
                                return;
                        }

                        // =============================================
                        // 🔐 AUTENTICA NO CONTEXTO SPRING
                        // =============================================
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        usuario,
                                        null,
                                        usuario.getAuthorities());

                        SecurityContextHolder
                                        .getContext()
                                        .setAuthentication(auth);

                        // =============================================
                        // 📊 LOG DE AUTENTICAÇÃO
                        // =============================================
                        log.debug(
                                        "Usuário autenticado: {}",
                                        email);

                        // =============================================
                        // 📊 LOG DE AUDITORIA TÉCNICA
                        // =============================================
                        log.debug(
                                        "Requisição autenticada [{} {}] por {}",
                                        request.getMethod(),
                                        request.getRequestURI(),
                                        email);

                } catch (Exception e) {

                        // =============================================
                        // ❌ ERRO AO PROCESSAR TOKEN
                        // =============================================
                        log.error(
                                        "Erro ao processar JWT para [{} {}]",
                                        request.getMethod(),
                                        request.getRequestURI(),
                                        e);
                }

                filterChain.doFilter(request, response);
        }
}
