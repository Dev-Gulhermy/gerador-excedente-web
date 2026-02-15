package com.excedente.controller;

import com.excedente.model.ResultadoDTO;
import com.excedente.service.ExcedenteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * ============================================================
 * CONTROLLER DE EXCEDENTE
 * ============================================================
 *
 * - Recebe CSV via multipart
 * - Aplica filtros opcionais (teleevento / comunicação)
 * - Retorna SEMPRE JSON estruturado
 * - Garante serialização completa do ResultadoDTO
 */
@RestController
@RequestMapping("/api/excedente")
@CrossOrigin(origins = "*")
public class ExcedenteController {

    private final ExcedenteService service;

    public ExcedenteController(ExcedenteService service) {
        this.service = service;
    }

    /**
     * ============================================================
     * ENDPOINT PRINCIPAL – PROCESSAMENTO DO CSV
     * ============================================================
     *
     * @param file        Arquivo CSV
     * @param teleevento  Filtro opcional de teleevento
     * @param comunicacao Filtro opcional de comunicação
     * @return ResultadoDTO serializado completo
     */
    @PostMapping("/processar")
    public ResponseEntity<ResultadoDTO> processar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "teleevento", required = false) String teleevento,
            @RequestParam(value = "comunicacao", required = false) String comunicacao) {

        try {
            ResultadoDTO resultado = service.processar(file, teleevento, comunicacao);

            // =====================================================
            // 🔥 LOGS DE AUDITORIA (CONFIRMAÇÃO DEFINITIVA)
            // =====================================================
            System.out.println("PLACA: " + resultado.getPlaca());
            System.out.println("DATA INÍCIO: " + resultado.getDataInicio());
            System.out.println("DATA FIM: " + resultado.getDataFim());
            System.out.println("ARQUIVO: " + resultado.getNomeArquivo());

            return ResponseEntity.ok(resultado);

        } catch (RuntimeException e) {
            // =====================================================
            // ERROS DE REGRA / FILTRO → 400
            // =====================================================
            throw e;

        } catch (Exception e) {
            // =====================================================
            // ERROS INESPERADOS → 500
            // =====================================================
            throw new RuntimeException("Erro interno ao processar o arquivo CSV");
        }
    }
}
