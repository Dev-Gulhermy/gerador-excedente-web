package com.geradorexcedente.security;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /*
     * =========================================
     * MAPA DE BUCKETS
     * =========================================
     *
     * Cada IP terá seu próprio bucket.
     *
     * Exemplo:
     *
     * 192.168.0.1 -> bucket
     * 10.0.0.2 -> bucket
     *
     */

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // =========================================
    // 🪣 CRIAR BUCKET
    // =========================================
    private Bucket criarBucket() {

        return Bucket.builder()

                /*
                 * =====================================
                 * 5 requisições por minuto
                 * =====================================
                 */
                .addLimit(
                        Bandwidth.builder()
                                .capacity(5)
                                .refillGreedy(
                                        5,
                                        Duration.ofMinutes(1))
                                .build())

                .build();
    }

    // =========================================
    // 🔐 FILTRO
    // =========================================
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        /*
         * =====================================
         * SOMENTE LOGIN
         * =====================================
         */

        String path = request.getServletPath();

        if (!path.equals("/auth/login")) {

            filterChain.doFilter(request, response);

            return;
        }

        /*
         * =====================================
         * CAPTURA IP
         * =====================================
         */

        String ip = request.getRemoteAddr(); // No Render/Proxy isso pode retornar: 127.0.0.1
        // O correto futuramente: request.getHeader("X-Forwarded-For")

        /*
         * =====================================
         * BUSCA/CRIA BUCKET
         * =====================================
         */

        Bucket bucket = buckets.computeIfAbsent(
                ip,
                k -> criarBucket());

        /*
         * =====================================
         * CONSUME TOKEN
         * =====================================
         */

        if (!bucket.tryConsume(1)) {

            /*
             * HTTP 429
             * TOO MANY REQUESTS
             */

            response.setStatus(429);

            response.getWriter()
                    .write("Muitas tentativas. Aguarde 1 minuto.");

            return;
        }

        /*
         * =====================================
         * CONTINUA FLUXO
         * =====================================
         */

        filterChain.doFilter(request, response);
    }
}