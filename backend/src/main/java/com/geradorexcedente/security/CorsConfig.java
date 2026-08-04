package com.geradorexcedente.security;

import java.util.List; // IMPORT NECESSÁRIO

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class CorsConfig {

        @Bean
        CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration config = new CorsConfiguration();

                // ================================================
                // 🌍 CORS CONFIGURATION
                // ================================================
                //
                // DESENVOLVIMENTO (localhost):
                // - Permite qualquer porta em http://localhost
                // - Permite qualquer porta em http://127.0.0.1
                //
                // PRODUÇÃO (Render):
                // - Comentar setAllowedOriginPatterns (DEV)
                // - Descomenta setAllowedOrigins (PROD)
                // - Substituir URL pelo domínio correto no Render
                //
                // ⚠️ IMPORTANTE:
                // - NUNCA usar "*" (todas as origens)
                // - SEMPRE whitelista domínios específicos
                // - Usar HTTPS em produção
                //
                // ================================================

                // ✅ DESENVOLVIMENTO
                //config.setAllowedOriginPatterns(List.of(
                //                "http://localhost:*",
                //                "http://127.0.0.1:*"));

                // ❌ COMENTADO - ATIVAR EM PRODUÇÃO
                // Substituir pela URL do seu domínio
                 config.setAllowedOrigins(List.of(
                 "https://gerador-excedente.netlify.app"
                 ));

                config.setAllowedMethods(List.of(
                                "GET",
                                "POST",
                                "PUT",
                                "PATCH",
                                "DELETE",
                                "OPTIONS"));

                config.setAllowedHeaders(List.of("*"));

                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", config);

                return source;
        }
}