package com.geradorexcedente.master.dto;

public class StatusHttpDTO {

    private long status200;

    private long status201;

    private long status400;

    private long status401;

    private long status403;

    private long status404;

    private long status500;

    public StatusHttpDTO() {
    }

    public long getStatus200() {
        return status200;
    }

    public void setStatus200(long status200) {
        this.status200 = status200;
    }

    public long getStatus201() {
        return status201;
    }

    public void setStatus201(Long status201) {
        this.status201 = status201;
    }

    public long getStatus400() {
        return status400;
    }

    public void setStatus400(long status400) {
        this.status400 = status400;
    }

    public long getStatus401() {
        return status401;
    }

    public void setStatus401(long status401) {
        this.status401 = status401;
    }

    public long getStatus403() {
        return status403;
    }

    public void setStatus403(long status403) {
        this.status403 = status403;
    }

    public long getStatus404() {
        return status404;
    }

    public void setStatus404(long status404) {
        this.status404 = status404;
    }

    public long getStatus500() {
        return status500;
    }

    public void setStatus500(long status500) {
        this.status500 = status500;
    }
}