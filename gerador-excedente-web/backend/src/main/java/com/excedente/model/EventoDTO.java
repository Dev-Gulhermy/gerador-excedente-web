package com.excedente.model;

public class EventoDTO {

    private String nome;
    private int qtd;
    private double percentual;

    public EventoDTO(String nome, int qtd, double percentual) {
        this.nome = nome;
        this.qtd = qtd;
        this.percentual = percentual;
    }

    public String getNome() {
        return nome;
    }

    public int getQtd() {
        return qtd;
    }

    public double getPercentual() {
        return percentual;
    }
}