package com.geradorexcedente.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final JwtFilter jwtFilter;

        private final RateLimitFilter rateLimitFilter;

        private final CorsConfigurationSource corsConfigurationSource;

        SecurityConfig(CorsConfigurationSource corsConfigurationSource, RateLimitFilter rateLimitFilter,
                        JwtFilter jwtFilter) {
                this.corsConfigurationSource = corsConfigurationSource;
                this.rateLimitFilter = rateLimitFilter;
                this.jwtFilter = jwtFilter;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

                http

                                // =========================================
                                // 🌍 CORS
                                // =========================================
                                .cors(cors -> cors.configurationSource(
                                                corsConfigurationSource))

                                // =========================================
                                // 🔥 CSRF DESABILITADO
                                // =========================================
                                /*
                                 * API Stateless com JWT
                                 *
                                 * Não utiliza sessão HTTP.
                                 *
                                 * Portanto:
                                 * CSRF não é necessário.
                                 */
                                .csrf(csrf -> csrf.disable())

                                // =========================================
                                // 🔐 SESSÃO STATELESS
                                // =========================================
                                .sessionManagement(sess -> sess.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                // =========================================
                                // 🛡 SECURITY HEADERS
                                // =========================================
                                .headers(headers -> headers

                                                /*
                                                 * =====================================
                                                 * CSP (CONTENT SECURITY POLICY)
                                                 * =====================================
                                                 *
                                                 * Define quais recursos o navegador
                                                 * pode carregar.
                                                 *
                                                 * default-src 'self'
                                                 *
                                                 * Permite apenas recursos do
                                                 * próprio domínio.
                                                 *
                                                 * Protege contra:
                                                 * - XSS
                                                 * - Scripts maliciosos
                                                 * - Injeções externas
                                                 */
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                "default-src 'self'"))

                                                /*
                                                 * =====================================
                                                 * FRAME OPTIONS
                                                 * =====================================
                                                 *
                                                 * Protege contra:
                                                 * - CLICKJACKING
                                                 *
                                                 * SAMEORIGIN:
                                                 * permite iframe apenas do
                                                 * mesmo domínio.
                                                 */
                                                .frameOptions(frame -> frame.sameOrigin())

                                                /*
                                                 * =====================================
                                                 * X-XSS-PROTECTION
                                                 * =====================================
                                                 *
                                                 * Header legado.
                                                 *
                                                 * Navegadores modernos ignoram.
                                                 *
                                                 * Spring recomenda desabilitar.
                                                 */
                                                .xssProtection(xss -> xss.disable())

                                                /*
                                                 * =====================================
                                                 * HSTS
                                                 * =====================================
                                                 *
                                                 * Obriga HTTPS.
                                                 *
                                                 * Protege contra:
                                                 * - MITM
                                                 * - Downgrade HTTP
                                                 *
                                                 * maxAge:
                                                 * 31536000 = 1 ano
                                                 */
                                                .httpStrictTransportSecurity(hsts -> hsts

                                                                .includeSubDomains(true)

                                                                .maxAgeInSeconds(31536000)))

                                // =========================================
                                // 🔐 AUTORIZAÇÃO
                                // =========================================
                                .authorizeHttpRequests(auth -> auth
                                                // 🔓 públicas
                                                .requestMatchers("/auth/login", "/auth/refresh").permitAll()
                                                .requestMatchers("/auth/check-auth").authenticated()
                                                .requestMatchers(HttpMethod.POST, "/usuario").permitAll()
                                                .requestMatchers("/health", "/warmup").permitAll()
                                                .requestMatchers("/error").permitAll()
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                // 👑 MASTER
                                                .requestMatchers("/api/master/**").hasRole("MASTER")
                                                // 🔐 autenticadas
                                                .requestMatchers("/usuario/**").authenticated()
                                                .requestMatchers("/api/excedente/**").authenticated()
                                                .anyRequest()
                                                .authenticated())

                                // =========================================
                                // 🚦 RATE LIMIT
                                // =========================================
                                .addFilterBefore(
                                                rateLimitFilter,
                                                UsernamePasswordAuthenticationFilter.class)

                                // =========================================
                                // 🔑 JWT
                                // =========================================
                                .addFilterBefore(
                                                jwtFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}