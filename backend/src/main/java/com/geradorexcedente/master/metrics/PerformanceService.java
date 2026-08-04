package com.geradorexcedente.master.metrics;

import java.lang.management.ManagementFactory;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicLong;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.sun.management.OperatingSystemMXBean;

/*
PerformanceService → coleta e armazena as métricas em memória.
MasterService → apenas monta o DashboardDTO utilizando essas métricas.
*/

@Service
public class PerformanceService {

    private final AtomicLong totalRequisicoes = new AtomicLong();

    private final AtomicLong somaTempo = new AtomicLong();

    private final ConcurrentLinkedQueue<Long> timestamps =
            new ConcurrentLinkedQueue<>();

    private final ConcurrentHashMap<Integer, AtomicLong> statusHttp = 
            new ConcurrentHashMap<>();


    // =================================
    // Método registrar
    // ================================= 
    public void registrar(long tempoMs) {
        totalRequisicoes.incrementAndGet();

        somaTempo.addAndGet(tempoMs);

        timestamps.add(System.currentTimeMillis());

        limparAntigas();

    }

    private void limparAntigas() {

        long limite = System.currentTimeMillis() - 60_000; // 1 minuto

        while (!timestamps.isEmpty()
            && timestamps.peek() < limite) {

            timestamps.poll();
        }
    }

    /**
     * =====================================================
     * 💾 Memória utilizada pela JVM
     * =====================================================
     */
    public long memoriaUsada() {

        Runtime runtime = Runtime.getRuntime();

        return runtime.totalMemory() - runtime.freeMemory();
    }

    /**
     * =====================================================
     * 💾 Memória máxima configurada
     * =====================================================
     */
    public long memoriaMaxima() {

        return Runtime.getRuntime().maxMemory();
    }

    /**
     * =====================================================
     * 🖥 Uso de CPU
     * =====================================================
     */
    public double cpu() {

        OperatingSystemMXBean os = ManagementFactory.getPlatformMXBean(
                OperatingSystemMXBean.class);

        double cpu = os.getCpuLoad();

        if (cpu < 0) {
            return 0;
        }

        return cpu * 100;
    }

    /**
     * =====================================================
     * ⏱ Tempo médio das requisições
     * =====================================================
     *
     * Futuramente será alimentado por um Filter.
     */
    public double tempoMedio() {

        long total = totalRequisicoes.get();

        if (total == 0) {
            return 0;
        }

        return (double) somaTempo.get() / total;
    }

    /**
     * =====================================================
     * 🚀 RPM
     * =====================================================
     *
     * Futuramente será calculado por um Filter.
     */
    public long requisicoesPorMinuto() {

        limparAntigas();

        return timestamps.size();
    }

    /**
    * ============================================
    * 📊 Status HTTP
    * ============================================
    */
   public Map<Integer, Long> obterStatusHttp() {

        Map<Integer, Long> retorno = new HashMap<>();

        statusHttp.forEach((codigo, quantidade) ->
            retorno.put(codigo,quantidade.get())
        );

        return retorno;
   }

}