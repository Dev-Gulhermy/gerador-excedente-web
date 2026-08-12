package com.geradorexcedente.master.logging;

import java.time.LocalDateTime;

public class RegistroLog {

    // =========================================
    // Dados do evento
    // =========================================

    // Quando ocorreu
    private LocalDateTime dataHora;

    // INFO / WARN / ERROR / DEBUG / TRACE
    private String nivel;

    // Classe que gerou o log
    private String classe;

    // =========================================
    // Origem do log
    // =========================================

    // Método
    private String metodo;

    // Linha
    private Integer linha;

    // Mensagem
    private String mensagem;

    // Thread
    private String thread;

    // =========================================
    // Dados da requisição
    // =========================================

    // console
    private String console;

    // URI da requisição
    private String uri;

    // Usuário autenticado
    private String usuario;

    // IP
    private String ip;

    // Tempo da requisição
    private Long tempoRequisicao;

    // Correlation Id / Request Id
    private String requestId;

    // =========================================
    // Erros
    // =========================================

    // StackTrace
    private String stackTrace;

    // Exception
    private String exception;

    public RegistroLog() {
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public String getClasse() {
        return classe;
    }

    public void setClasse(String classe) {
        this.classe = classe;
    }

    public String getMetodo() {
        return metodo;
    }

    public void setMetodo(String metodo) {
        this.metodo = metodo;
    }

    public Integer getLinha() {
        return linha;
    }

    public void setLinha(Integer linha) {
        this.linha = linha;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public String getThread() {
        return thread;
    }

    public void setThread(String thread) {
        this.thread = thread;
    }

    public String getconsole() {
        return console;
    }

    public void setconsole(String console) {
        this.console = console;
    }

    public String getUri() {
        return uri;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Long getTempoRequisicao() {
        return tempoRequisicao;
    }

    public void setTempoRequisicao(Long tempoRequisicao) {
        this.tempoRequisicao = tempoRequisicao;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(String stackTrace) {
        this.stackTrace = stackTrace;
    } 

    public String getException() {
        return exception;
    }

    public void setException(String exception) {
        this.exception = exception;
    }







}