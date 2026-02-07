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

    public ResultadoDTO processar(
            MultipartFile file,
            String filtroTeleevento,
            String filtroComunicacao) throws Exception {

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        String header = reader.readLine();
        if (header == null) {
            throw new RuntimeException("Arquivo CSV vazio");
        }

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

            if (csvCorporativo) {

                if (colunas.length < 5)
                    continue;

                placa = limpar(colunas[0]);
                String teleevento = limpar(colunas[2]);
                String comunicacao = limpar(colunas[4]);

                // 🔎 FILTRO TELEEVENTO
                if (filtroTeleevento != null && !filtroTeleevento.isBlank()) {
                    if (!teleevento.equalsIgnoreCase(filtroTeleevento))
                        continue;
                }

                // 🔎 FILTRO COMUNICAÇÃO
                if (filtroComunicacao != null && !filtroComunicacao.isBlank()) {
                    if (!comunicacao.equalsIgnoreCase(filtroComunicacao))
                        continue;
                }

                contagem.merge(teleevento, 1, Integer::sum);
            } else {
                // CSV simples: placa;evento
                if (colunas.length < 2)
                    continue;

                placa = limpar(colunas[0]);
                String evento = limpar(colunas[1]);

                contagem.merge(evento, 1, Integer::sum);
            }

            total++;
        }

        if (total == 0) {
            throw new RuntimeException("Nenhum dado encontrado com os filtros aplicados");
        }

        return montarResultado(placa, total, contagem);
    }

    // 🔧 MÉTODO AUXILIAR 1 (OBRIGATÓRIO)
    private String limpar(String valor) {
        return valor.replace("\"", "").trim();
    }

    // 🔧 MÉTODO AUXILIAR 2 (OBRIGATÓRIO)
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