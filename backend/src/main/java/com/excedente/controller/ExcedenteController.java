package com.excedente.controller;

import com.excedente.model.ResultadoDTO;
import com.excedente.service.ExcedenteService;

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

    /* ----------------------------------------------------------------- */
    @PostMapping("/processar")
    public ResponseEntity<?> processar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String teleevento,
            @RequestParam(required = false) String comunicacao) {
        try {
            ResultadoDTO resultado = service.processar(file, teleevento, comunicacao);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao processar o arquivo CSV");
        }
    }
    /* ----------------------------------------------------------------- */
}