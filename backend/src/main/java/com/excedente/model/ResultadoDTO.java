package com.excedente.model;

import java.util.List;

/**
 * DTO responsável por transportar o resultado
 * do processamento de Excedente Satelital.
 */
public class ResultadoDTO {

    private String placa;
    private int total;
    private List<EventoDTO> eventos;

    // ===============================
    // METADADOS DE IDENTIFICAÇÃO
    // ===============================
    private String dataInicio;
    private String dataFim;
    private String nomeArquivo;

    // ===============================
    // CONSTRUTOR COMPLETO
    // ===============================
    public ResultadoDTO(
            String placa,
            int total,
            List<EventoDTO> eventos,
            String dataInicio,
            String dataFim,
            String nomeArquivo) {

        this.placa = placa;
        this.total = total;
        this.eventos = eventos;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.nomeArquivo = nomeArquivo;
    }

    public String getPlaca() {
        return placa;
    }

    public int getTotal() {
        return total;
    }

    public List<EventoDTO> getEventos() {
        return eventos;
    }

    public String getDataInicio() {
        return dataInicio;
    }

    public String getDataFim() {
        return dataFim;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }
}
