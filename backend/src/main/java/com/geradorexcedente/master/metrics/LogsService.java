package com.geradorexcedente.master.metrics;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

import com.geradorexcedente.master.dto.LogsDTO;

@Service
public class LogsService {

    private final AtomicLong info = new AtomicLong();

    private final AtomicLong warn = new AtomicLong();

    private final AtomicLong error = new AtomicLong();

    private final AtomicLong debug = new AtomicLong();

    private final AtomicLong trace = new AtomicLong();

    public void registrarInfo() {

        info.incrementAndGet();

    }

    public void registrarWarn() {

        warn.incrementAndGet();

    }

    public void registrarError() {

        error.incrementAndGet();

    }

    public void registrarDebug() {

        debug.incrementAndGet();

    }

    public void registrarTrace() {

        trace.incrementAndGet();

    }

    public LogsDTO obterLogs() {

        LogsDTO dto = new LogsDTO();

        dto.setInfo(info.get());

        dto.setWarn(warn.get());

        dto.setError(error.get());

        dto.setDebug(debug.get());

        dto.setTrace(trace.get());

        return dto;

    }

}