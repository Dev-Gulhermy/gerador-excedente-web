package com.excedente.service;

import com.excedente.model.EventoDTO;
import com.excedente.model.ResultadoDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ExcedenteService {

    /**
     * Processa o CSV aplicando filtros opcionais de teleevento e comunicação.
     *
     * Regras de comunicação (SEMÂNTICAS):
     * - GPRS → GPRS - VIVO / TIM / CLARO / etc
     * - Satélite → qualquer valor contendo "SAT"
     * - Em memória → qualquer valor contendo "MEM"
     *
     * Caso nenhum filtro seja informado, todos os registros são considerados.
     */
    public ResultadoDTO processar(
            MultipartFile file,
            String filtroTeleevento,
            String filtroComunicacao) throws Exception {

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        // 🔎 Lê cabeçalho para validar CSV
        String header = reader.readLine();
        if (header == null) {
            throw new RuntimeException("Arquivo CSV vazio");
        }

        // CSV corporativo possui coluna Teleevento
        boolean csvCorporativo = header.contains("Teleevento");
        String separador = ",";

        Map<String, Integer> contagem = new HashMap<>();
        String placa = null;
        int total = 0;

        String linha;
        while ((linha = reader.readLine()) != null) {

            if (linha.isBlank())
                continue;

            String[] colunas = linha.split(separador);

            // ================= CSV CORPORATIVO =================
            if (csvCorporativo) {

                if (colunas.length < 5)
                    continue;

                placa = limpar(colunas[0]);
                String teleevento = limpar(colunas[2]);
                String comunicacao = limpar(colunas[4]);

                // 🔎 FILTRO DE TELEEVENTO (COMPARAÇÃO EXATA)
                if (filtroTeleevento != null && !filtroTeleevento.isBlank()) {
                    if (!teleevento.equalsIgnoreCase(filtroTeleevento))
                        continue;
                }

                // 🔎 FILTRO DE COMUNICAÇÃO (SEMÂNTICO / INTELIGENTE)
                if (!comunicacaoAceita(comunicacao, filtroComunicacao))
                    continue;

                // Contabiliza eventos válidos
                contagem.merge(teleevento, 1, Integer::sum);

            } else {
                // ================= CSV SIMPLES =================
                // Formato: placa;evento
                if (colunas.length < 2)
                    continue;

                placa = limpar(colunas[0]);
                String evento = limpar(colunas[1]);

                contagem.merge(evento, 1, Integer::sum);
            }

            total++;
        }

        // ❌ Nenhum dado após aplicação dos filtros
        if (total == 0) {
            throw new RuntimeException("Nenhum dado encontrado com os filtros aplicados");
        }

        return montarResultado(placa, total, contagem);
    }

    /**
     * Define se a comunicação do CSV atende ao filtro selecionado no frontend.
     *
     * Exemplo:
     * - Filtro: "GPRS"
     * - CSV: "GPRS - TIM" → ACEITA
     */
    private boolean comunicacaoAceita(String comunicacaoCSV, String filtro) {

        // Sem filtro → aceita tudo
        if (filtro == null || filtro.isBlank())
            return true;

        if (comunicacaoCSV == null)
            return false;

        // Normalização para evitar problemas de caixa/acentos
        String csv = comunicacaoCSV.toUpperCase();
        String f = filtro.toUpperCase();

        return switch (f) {
            case "GPRS" -> csv.startsWith("GPRS");
            case "SATÉLITE", "SATELITE" -> csv.contains("SAT");
            case "EM MEMÓRIA", "EM MEMORIA" -> csv.contains("MEM");
            default -> true; // fallback de segurança
        };
    }

    /**
     * Remove aspas e espaços extras do CSV
     */
    private String limpar(String valor) {
        return valor.replace("\"", "").trim();
    }

    /**
     * Monta o DTO final com total e percentuais
     */
    private ResultadoDTO montarResultado(
            String placa,
            int total,
            Map<String, Integer> contagem) {

        List<EventoDTO> eventos = new ArrayList<>();

        for (var entry : contagem.entrySet()) {
            double percentual = (entry.getValue() * 100.0) / total;

            eventos.add(new EventoDTO(
                    entry.getKey(),
                    entry.getValue(),
                    percentual));
        }

        return new ResultadoDTO(placa, total, eventos);
    }
}
