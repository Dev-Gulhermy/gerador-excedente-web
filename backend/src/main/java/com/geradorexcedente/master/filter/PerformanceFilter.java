package com.geradorexcedente.master.filter;

import java.io.IOException;

import org.springframework.stereotype.Component;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.filter.OncePerRequestFilter;

import com.geradorexcedente.master.metrics.HttpMetricsService;
import com.geradorexcedente.master.metrics.PerformanceService;

@Component
public class PerformanceFilter extends OncePerRequestFilter {


    private final PerformanceService performanceService;
    private final HttpMetricsService httpMetricsService;

    public PerformanceFilter(
            PerformanceService performanceService,
            HttpMetricsService httpMetricsService) {

        this.performanceService = performanceService;
        this.httpMetricsService = httpMetricsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        long inicio = System.nanoTime();

try {

    filterChain.doFilter(request, response);

} finally {

    long tempoMs =
        (System.nanoTime() - inicio) / 1_000_000;

    performanceService.registrar(tempoMs);

    httpMetricsService.registrar(
            response.getStatus());

        }
    }
}
