package com.geradorexcedente.master.dto;

/**
 * ==========================================================
 * DASHBOARD DTO
 * ==========================================================
 *
 * DTO responsável por transportar todas as informações
 * exibidas no painel MASTER.
 *
 * Contém:
 * - Usuários
 * - Memória JVM
 * - CPU
 * - Tempo médio das requisições
 * - Requisições por minuto
 * - Status HTTP
 * - Logs
 * - Sessões
 *
 * ==========================================================
 */
public class DashboardDTO {

    // ============================
    // ----------- Cards ----------
    // ============================

    // ======================================================
    // 👤 USUÁRIOS
    // ======================================================

    private int usuariosOnline;
    private int usuariosTotal;
    private int usuariosBloqueados;

    // ======================================================
    // 💾 MEMÓRIA JVM
    // ======================================================

    private long memoriaUsada;
    private long memoriaMaxima;

    // ======================================================
    // 🖥 CPU
    // ======================================================

    private double cpu;

    // ======================================================
    // ⚡ PERFORMANCE
    // ======================================================

    private double tempoMedioRequisicoes;
    private long requisicoesPorMinuto;

    // ============================
    // -------- Gráficos ----------
    // ============================

    // ======================================================
    // 📊 ESTATÍSTICAS
    // ======================================================

    private StatusHttpDTO statusHttp;
    private LogsDTO logs;
    private SessoesDTO sessoes;

    // ======================================================
    // 👤 USUÁRIOS
    // ======================================================

    public int getUsuariosOnline() {
        return usuariosOnline;
    }

    public void setUsuariosOnline(int usuariosOnline) {
        this.usuariosOnline = usuariosOnline;
    }

    public int getUsuariosTotal() {
        return usuariosTotal;
    }

    public void setUsuariosTotal(int usuariosTotal) {
        this.usuariosTotal = usuariosTotal;
    }

    public int getUsuariosBloqueados() {
        return usuariosBloqueados;
    }

    public void setUsuariosBloqueados(int usuariosBloqueados) {
        this.usuariosBloqueados = usuariosBloqueados;
    }

    // ======================================================
    // 💾 MEMÓRIA
    // ======================================================

    public long getMemoriaUsada() {
        return memoriaUsada;
    }

    public void setMemoriaUsada(long memoriaUsada) {
        this.memoriaUsada = memoriaUsada;
    }

    public long getMemoriaMaxima() {
        return memoriaMaxima;
    }

    public void setMemoriaMaxima(long memoriaMaxima) {
        this.memoriaMaxima = memoriaMaxima;
    }

    // ======================================================
    // 🖥 CPU
    // ======================================================

    public double getCpu() {
        return cpu;
    }

    public void setCpu(double cpu) {
        this.cpu = cpu;
    }

    // ======================================================
    // ⚡ PERFORMANCE
    // ======================================================

    public double getTempoMedioRequisicoes() {
        return tempoMedioRequisicoes;
    }

    public void setTempoMedioRequisicoes(double tempoMedioRequisicoes) {
        this.tempoMedioRequisicoes = tempoMedioRequisicoes;
    }

    public long getRequisicoesPorMinuto() {
        return requisicoesPorMinuto;
    }

    public void setRequisicoesPorMinuto(long requisicoesPorMinuto) {
        this.requisicoesPorMinuto = requisicoesPorMinuto;
    }

    // ======================================================
    // 📊 STATUS HTTP
    // ======================================================

    public StatusHttpDTO getStatusHttp() {
        return statusHttp;
    }

    public void setStatusHttp(StatusHttpDTO statusHttp) {
        this.statusHttp = statusHttp;
    }

    // ======================================================
    // 📝 LOGS
    // ======================================================

    public LogsDTO getLogs() {
        return logs;
    }

    public void setLogs(LogsDTO logs) {
        this.logs = logs;
    }

    // ======================================================
    // 👥 SESSÕES
    // ======================================================

    public SessoesDTO getSessoes() {
        return sessoes;
    }

    public void setSessoes(SessoesDTO sessoes) {
        this.sessoes = sessoes;
    }

}