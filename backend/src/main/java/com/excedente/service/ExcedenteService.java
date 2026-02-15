package com.excedente.service;

import com.excedente.model.EventoDTO;
import com.excedente.model.ResultadoDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ============================================================
 * SERVICE RESPONSÁVEL PELO PROCESSAMENTO DOS CSVs DE EXCEDENTE
 * ============================================================
 *
 * ✔ Leitura de CSV corporativo ou simples
 * ✔ Aplicação de filtros (Teleevento / Comunicação)
 * ✔ Cálculo de totalizações e percentuais
 * ✔ Identificação de período (data inicial e final)
 * ✔ Retorno estruturado para o frontend
 */
@Service
public class ExcedenteService {

    /**
     * ============================================================
     * FORMATADOR DE DATA DO CSV
     * Formato real recebido:
     * "27/12/2025 16:45:00"
     * ============================================================
     */
    private static final DateTimeFormatter FORMATTER_CSV = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * ============================================================
     * FORMATADOR DE DATA PARA O FRONTEND
     * ============================================================
     */
    private static final DateTimeFormatter FORMATTER_FRONT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * ============================================================
     * MÉTODO PRINCIPAL DE PROCESSAMENTO
     * ============================================================
     */
    public ResultadoDTO processar(
            MultipartFile file,
            String filtroTeleevento,
            String filtroComunicacao) throws Exception {

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        // ===============================
        // LEITURA DO CABEÇALHO
        // ===============================
        String header = reader.readLine();
        if (header == null) {
            throw new RuntimeException("Arquivo CSV vazio");
        }

        header = header.replace("\"", "").toUpperCase();

        // ✔ Detecção robusta de CSV corporativo
        boolean csvCorporativo = header.contains("DATA") &&
                header.contains("TELEEVENTO") &&
                header.contains("TIPO DE COMUNICAÇÃO");

        // Regex seguro para CSV com aspas
        String separadorCSV = ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)";

        // ===============================
        // CONTROLE DE PERÍODO
        // ===============================
        LocalDateTime dataInicio = null;
        LocalDateTime dataFim = null;

        // ===============================
        // VARIÁVEIS DE PROCESSAMENTO
        // ===============================
        Map<String, Integer> contagem = new HashMap<>();
        String placa = null;
        int total = 0;

        String linha;

        // ===============================
        // LEITURA LINHA A LINHA
        // ===============================
        while ((linha = reader.readLine()) != null) {

            if (linha.isBlank())
                continue;

            String[] colunas = linha.split(separadorCSV);

            // =====================================================
            // CSV CORPORATIVO (COM DATA)
            // =====================================================
            if (csvCorporativo) {

                if (colunas.length < 5)
                    continue;

                placa = limpar(colunas[0]);

                // ===============================
                // PARSE SEGURO DA DATA
                // ===============================
                LocalDateTime dataEvento;
                try {
                    dataEvento = LocalDateTime.parse(
                            limpar(colunas[1]),
                            FORMATTER_CSV);
                } catch (Exception e) {
                    // Linha inválida → ignora sem quebrar o processamento
                    continue;
                }

                String teleevento = limpar(colunas[2]);
                String comunicacao = limpar(colunas[4]);

                // ===============================
                // CONTROLE DE PERÍODO
                // ===============================
                if (dataInicio == null || dataEvento.isBefore(dataInicio)) {
                    dataInicio = dataEvento;
                }

                if (dataFim == null || dataEvento.isAfter(dataFim)) {
                    dataFim = dataEvento;
                }

                // ===============================
                // FILTROS
                // ===============================
                if (filtroTeleevento != null && !filtroTeleevento.isBlank()
                        && !teleevento.equalsIgnoreCase(filtroTeleevento)) {
                    continue;
                }

                if (!comunicacaoAceita(comunicacao, filtroComunicacao)) {
                    continue;
                }

                contagem.merge(teleevento, 1, Integer::sum);
                total++;

            } else {
                // =====================================================
                // CSV SIMPLES (SEM DATA)
                // =====================================================
                if (colunas.length < 2)
                    continue;

                placa = limpar(colunas[0]);
                String evento = limpar(colunas[1]);

                contagem.merge(evento, 1, Integer::sum);
                total++;
            }
        }

        // ===============================
        // VALIDAÇÃO FINAL
        // ===============================
        if (total == 0) {
            throw new RuntimeException("Nenhum dado encontrado com os filtros aplicados");
        }

        // =====================================================
        // FORMATAÇÃO FINAL DO PERÍODO
        // =====================================================
        String dataInicioStr = "N/A";
        String dataFimStr = "N/A";

        if (dataInicio != null && dataFim != null) {
            dataInicioStr = dataInicio.format(FORMATTER_FRONT);
            dataFimStr = dataFim.format(FORMATTER_FRONT);
        }

        // ===============================
        // RETORNO FINAL
        // ===============================
        return montarResultado(
                placa,
                total,
                contagem,
                dataInicioStr,
                dataFimStr,
                file.getOriginalFilename());
    }

    /**
     * ============================================================
     * MONTA O DTO FINAL
     * ============================================================
     */
    private ResultadoDTO montarResultado(
            String placa,
            int total,
            Map<String, Integer> contagem,
            String dataInicio,
            String dataFim,
            String nomeArquivo) {

        List<EventoDTO> eventos = new ArrayList<>();

        for (var entry : contagem.entrySet()) {
            double percentual = (entry.getValue() * 100.0) / total;

            eventos.add(new EventoDTO(
                    entry.getKey(),
                    entry.getValue(),
                    percentual));
        }

        eventos.sort((a, b) -> Integer.compare(b.getQtd(), a.getQtd()));

        return new ResultadoDTO(
                placa,
                total,
                eventos,
                dataInicio,
                dataFim,
                nomeArquivo);
    }

    /**
     * ============================================================
     * VALIDAÇÃO DE COMUNICAÇÃO
     * ============================================================
     */
    private boolean comunicacaoAceita(String comunicacaoCSV, String filtro) {

        if (filtro == null || filtro.isBlank())
            return true;

        if (comunicacaoCSV == null)
            return false;

        String csv = comunicacaoCSV.toUpperCase().trim();
        String f = filtro.toUpperCase().trim();

        return switch (f) {
            case "GPRS" -> csv.startsWith("GPRS");
            case "SATÉLITE", "SATELITE" -> csv.contains("SAT");
            case "EM MEMÓRIA", "EM MEMORIA" -> csv.contains("MEM");
            default -> true;
        };
    }

    /**
     * ============================================================
     * LIMPA ASPAS E ESPAÇOS
     * ============================================================
     */
    private String limpar(String valor) {
        return valor.replace("\"", "").trim();
    }
}
