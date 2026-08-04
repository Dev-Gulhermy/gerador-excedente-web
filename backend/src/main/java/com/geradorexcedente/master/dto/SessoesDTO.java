package com.geradorexcedente.master.dto;

public class SessoesDTO {

    private long master;

    private long admin;

    private long usuario;

    private long convidados;

    public long getMaster() {
        return master;
    }

    public void setMaster(long master) {
        this.master = master;
    }

    public long getAdmin() {
        return admin;
    }

    public void setAdmin(long admin) {
        this.admin = admin;
    }

    public long getUsuario() {
        return usuario;
    }

    public void setUsuario(long usuario) {
        this.usuario = usuario;
    }

    public long getConvidados() {
        return convidados;
    }

    public void setConvidados(long convidados) {
        this.convidados = convidados;
    }

}