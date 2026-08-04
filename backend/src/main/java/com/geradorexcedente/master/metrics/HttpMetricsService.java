package com.geradorexcedente.master.metrics;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

import com.geradorexcedente.master.dto.StatusHttpDTO;

@Service
public class HttpMetricsService {

    /*
     * AtomicLong
     *
     * Thread-safe.
     * Não sofre concorrência.
     */

    private final AtomicLong status200 = new AtomicLong();

    private final AtomicLong status201 = new AtomicLong();

    private final AtomicLong status400 = new AtomicLong();

    private final AtomicLong status401 = new AtomicLong();

    private final AtomicLong status403 = new AtomicLong();

    private final AtomicLong status404 = new AtomicLong();

    private final AtomicLong status500 = new AtomicLong();

    /**
     * Incrementa determinado status HTTP.
     */
    public void registrar(int status) {

        switch(status){

            case 200 -> status200.incrementAndGet();

            case 201 -> status201.incrementAndGet();

            case 400 -> status400.incrementAndGet();

            case 401 -> status401.incrementAndGet();

            case 403 -> status403.incrementAndGet();

            case 404 -> status404.incrementAndGet();

            case 500 -> status500.incrementAndGet();

            default -> {
                // outros códigos ignorados -- evita qualquer comportamento inesperado caso apareçam códigos como 204, 302 ou 503.
            }
        }   
    }

    /**
     * Retorna DTO.
     */
    public StatusHttpDTO obterMetricas() {

        StatusHttpDTO dto = new StatusHttpDTO();

        dto.setStatus200(status200.get());
        
        dto.setStatus201(status201.get());

        dto.setStatus400(status400.get());

        dto.setStatus401(status401.get());

        dto.setStatus403(status403.get());

        dto.setStatus404(status404.get());

        dto.setStatus500(status500.get());

        return dto;
    }

}