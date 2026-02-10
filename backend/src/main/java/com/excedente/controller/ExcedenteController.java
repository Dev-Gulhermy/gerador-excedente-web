package com.excedente.controller;

import com.excedente.model.ResultadoDTO;
import com.excedente.service.ExcedenteService;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/excedente")
@CrossOrigin(origins = "*")
public class ExcedenteController {

    private final ExcedenteService service;

    public ExcedenteController(ExcedenteService service) {
        this.service = service;
    }

    /*
     * -----------------------------------------------------------------
     * Processa o CSV aplicando filtros de teleevento e comunicação
     * Sempre retorna JSON (sucesso ou erro)
     * -----------------------------------------------------------------
     */
    @PostMapping("/processar")
    public ResponseEntity<?> processar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String teleevento,
            @RequestParam(required = false) String comunicacao) {

        try {
            ResultadoDTO resultado = service.processar(file, teleevento, comunicacao);
            return ResponseEntity.ok(resultado);

        } catch (RuntimeException e) {
            // 🔴 Erros de regra / filtro → 400
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "erro", true,
                            "mensagem", e.getMessage()));

        } catch (Exception e) {
            // 🔴 Erros inesperados → 500 (SEMPRE JSON)
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "erro", true,
                            "mensagem", "Erro interno ao processar o arquivo CSV"));
        }
    }
    /* ----------------------------------------------------------------- */
}
