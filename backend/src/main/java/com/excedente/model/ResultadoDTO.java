package com.excedente.model;

import java.util.List;

public class ResultadoDTO {

    private String placa;
    private int total;
    private List<EventoDTO> eventos;

    public ResultadoDTO(String placa, int total, List<EventoDTO> eventos) {
        this.placa = placa;
        this.total = total;
        this.eventos = eventos;
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
}