package com.geradorexcedente.master.dto;

public class LogsDTO {

    private long info;

    private long warn;

    private long error;

    private long debug;

    private long trace;

    public long getInfo() {
        return info;
    }

    public void setInfo(long info) {
        this.info = info;
    }

    public long getWarn() {
        return warn;
    }

    public void setWarn(long warn) {
        this.warn = warn;
    }

    public long getError() {
        return error;
    }

    public void setError(long error) {
        this.error = error;
    }

    public long getDebug() {
        return debug;
    }

    public void setDebug(long debug) {
        this.debug = debug;
    }

    public long getTrace() {
        return trace;
    }

    public void setTrace(long trace) {
        this.trace = trace;
    }

}