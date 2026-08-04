package com.geradorexcedente.excedente.service;

import com.geradorexcedente.excedente.model.EventoDTO;
import com.geradorexcedente.excedente.model.ResultadoDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.geradorexcedente.excedente.model.EventoTimelineDTO;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.text.Normalizer;

/**
 * ============================================================
 * SERVICE RESPONSÁVEL PELO PROCESSAMENTO DOS CSVs DE EXCEDENTE
 * ============================================================
 *
 * ✔ Leitura de CSV corporativo ou simples
 * ✔ Aplicação de filtros (Teleevento / Comunicação)
 * ✔ Cálculo de totalizações e percentuais
 * ✔ Identificação de período (data inicial e final)
 * ✔ Captura do intervalo de transmissão (coluna do CSV)
 * ✔ Retorno estruturado para o frontend
 */
@Service
public class ExcedenteService {

    // ============================================================
    // FORMATADORES DE DATA
    // ============================================================
    private static final DateTimeFormatter FORMATTER_CSV = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

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

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            // ============================================================
            // LEITURA DO CABEÇALHO
            // ============================================================
            String header = reader.readLine();

            if (header == null) {
                throw new RuntimeException("Arquivo CSV vazio");
            }

            header = header.replace("\"", "").toUpperCase();

            // ✔ Detecção de CSV corporativo
            boolean csvCorporativo = header.contains("DATA") &&
                    header.contains("TELEEVENTO") &&
                    header.contains("TIPO DE COMUNICAÇÃO");

            // Regex seguro para CSV com aspas
            String separadorCSV = ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)";

            // ============================================================
            // CONTROLE DE PERÍODO
            // ============================================================
            LocalDateTime dataInicio = null;
            LocalDateTime dataFim = null;

            Map<EventoKey, EventoInfo> contagem = new HashMap<>();
            String placa = null;
            int total = 0;

            // 🔥 NOVO (AQUI)
            List<EventoTimelineDTO> timeline = new ArrayList<>();

            // 🔥 INTERVALO DE TRANSMISSÃO (VINDO DO CSV)
            String intervaloCapturado = null;

            String linha;

            // ============================================================
            // LEITURA LINHA A LINHA
            // ============================================================
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
                    // PARSE DA DATA
                    // ===============================
                    LocalDateTime dataEvento;

                    try {
                        dataEvento = LocalDateTime.parse(
                                limpar(colunas[1]),
                                FORMATTER_CSV);
                    } catch (Exception e) {
                        continue;
                    }

                    String teleevento = limpar(colunas[2]);
                    String intervaloCSV = limpar(colunas[3]); // 🔥 "2 minutos"
                    String comunicacao = limpar(colunas[4]);

                    // ===============================
                    // 🔥 FILTRO DE COMUNICAÇÃO (AQUI)
                    // ===============================
                    if (!comunicacaoAceita(comunicacao, filtroComunicacao)) {
                        continue;
                    }

                    // ===============================
                    // FILTROS
                    // ===============================
                    if (filtroTeleevento != null && !filtroTeleevento.isBlank()
                            && !teleevento.equalsIgnoreCase(filtroTeleevento)) {
                        continue;
                    }

                    // ===============================
                    // CAPTURA DO INTERVALO (APÓS FILTRO)
                    // ===============================
                    if (intervaloCapturado == null && !intervaloCSV.isBlank()) {
                        intervaloCapturado = intervaloCSV;
                    }

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
                    // 📈 TIMELINE (NOVO)
                    // ===============================
                    timeline.add(new EventoTimelineDTO(
                            teleevento,
                            dataEvento.format(FORMATTER_CSV)));

                    // ===================================
                    // TESTE COMUNICAÇÂO SATELITE
                    //====================================
                    if (teleevento.equals("Posição Automática")) {
                        System.out.println(
                            teleevento + " -> " + comunicacao
                        );
                    }


                    // ===============================
                    // CONTAGEM
                    // ===============================
                    

EventoKey chave = new EventoKey(
        teleevento,
        comunicacao
);

contagem.putIfAbsent(
        chave,
        new EventoInfo()
);

contagem.get(chave).qtd++;
                    total++; // 🔥 ADICIONE ISSO
                }

                // =====================================================
                // CSV SIMPLES
                // =====================================================
                else {

                    if (colunas.length < 2)
                        continue;

                    placa = limpar(colunas[0]);
                    String evento = limpar(colunas[1]);

                    EventoKey chave = new EventoKey(evento, "N/A");

contagem.putIfAbsent(chave, new EventoInfo());

contagem.get(chave).incrementar();
                }
            }
            // ============================================================
            // VALIDAÇÃO FINAL
            // ============================================================
            if (total == 0) {
                throw new RuntimeException("Nenhum dado encontrado com os filtros aplicados");
            }

            // ============================================================
            // FORMATAÇÃO DE PERÍODO
            // ============================================================
            String dataInicioStr = "N/A";
            String dataFimStr = "N/A";

            if (dataInicio != null && dataFim != null) {
                dataInicioStr = dataInicio.format(FORMATTER_FRONT);
                dataFimStr = dataFim.format(FORMATTER_FRONT);
            }

            // ============================================================
            // GARANTE INTERVALO VÁLIDO
            // ============================================================
            if (intervaloCapturado == null || intervaloCapturado.isBlank()) {
                intervaloCapturado = "N/A";
            }

            // ============================================================
            // RETORNO FINAL
            // ============================================================
            return montarResultado(
                    placa,
                    total,
                    contagem,
                    timeline,
                    dataInicioStr,
                    dataFimStr,
                    file.getOriginalFilename(),
                    intervaloCapturado // 🔥 NOVO
            );
        }
    }

    // ============================================================
    // MONTA O DTO FINAL
    // ============================================================
    private ResultadoDTO montarResultado(
            String placa,
            int total,
            Map<EventoKey, EventoInfo> contagem, // 🔥 ALTERADO
            List<EventoTimelineDTO> timeline, // 👈 NOVO
            String dataInicio,
            String dataFim,
            String nomeArquivo,
            String intervaloTransmissao) {

        List<EventoDTO> eventos = new ArrayList<>();

        for (Map.Entry<EventoKey, EventoInfo> entry : contagem.entrySet()) {

    EventoKey key = entry.getKey();
    EventoInfo info = entry.getValue();

    double percentual = entry.getValue().getQtd() * 100.0 / total;

    eventos.add(new EventoDTO(
            key.getTeleevento(),
            info.qtd,
            percentual,
            key.getComunicacao()
    ));
}

        // Ordena do maior para o menor
        eventos.sort((a, b) -> Integer.compare(b.getQtd(), a.getQtd()));

        // ============================================================
        // RETORNO FINAL (CORRIGIDO)
        // ============================================================
        return new ResultadoDTO(
                placa,
                total,
                intervaloTransmissao, // 🔥 vindo do CSV
                eventos,
                timeline,
                dataInicio,
                dataFim,
                nomeArquivo);
    }

    private String normalizar(String texto) {

        if (texto == null)
            return "";

        // Remove acentos
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        // Remove espaços duplicados
        return semAcento
                .toUpperCase()
                .replaceAll("\\s+", " ")
                .trim();
    }

    // ============================================================
    // VALIDAÇÃO DE COMUNICAÇÃO
    // ============================================================
    private boolean comunicacaoAceita(String comunicacaoCSV, String filtro) {

        if (filtro == null || filtro.isBlank())
            return true;

        if (comunicacaoCSV == null)
            return false;

        // ======================================================
        // NORMALIZAÇÃO FORTE (REMOVE ACENTOS + ESPAÇOS)
        // ======================================================
        String csv = normalizar(comunicacaoCSV);
        String f = normalizar(filtro);

        return switch (f) {

            case "GPRS" -> csv.contains("GPRS");

            case "SATELITE" -> csv.contains("SAT");

            case "EM MEMORIA" -> csv.contains("MEM");

            default -> true;
        };
    }

    private static class EventoKey {

    private final String teleevento;
    private final String comunicacao;

    EventoKey(String teleevento, String comunicacao) {
        this.teleevento = teleevento;
        this.comunicacao = comunicacao;
    }

    public String getTeleevento() {
        return teleevento;
    }

    public String getComunicacao() {
        return comunicacao;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof EventoKey other)) return false;

        return Objects.equals(teleevento, other.teleevento)
                && Objects.equals(comunicacao, other.comunicacao);
    }

    @Override
    public int hashCode() {
        return Objects.hash(teleevento, comunicacao);
    }
}

    // ============================================================
    // CLASSE AUXILIAR PARA AGRUPAMENTO
    // ============================================================
    private static class EventoInfo {

    private int qtd;

    public void incrementar() {
        qtd++;
    }

    public int getQtd() {
        return qtd;
    }
}


    // ============================================================
    // LIMPEZA DE CAMPOS
    // ============================================================
    private String limpar(String valor) {
        return valor.replace("\"", "").trim();
    }
}