package com.geradorexcedente.master.logging;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.geradorexcedente.master.metrics.LogsService;

import ch.qos.logback.classic.Level;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;

@Component
public class DashboardLogAppender extends AppenderBase<ILoggingEvent>  {

    public static LogsService logsService;

    @Autowired
    public void setLogsService(LogsService service) {
        logsService = service;
    }

    @Override
    protected void append(ILoggingEvent event) {

        if (logsService == null) {
            return;
        }
        
       Level level = event.getLevel();

        if (level == Level.INFO) {
            logsService.registrarInfo();
        }
        else if (level == Level.WARN) {
            logsService.registrarWarn();
        }
        else if (level == Level.ERROR) {
            logsService.registrarError();
        }
        else if (level == Level.DEBUG) {
            logsService.registrarDebug();
        }
        else if (level == Level.TRACE) {
            logsService.registrarTrace();
        }
    }
}
