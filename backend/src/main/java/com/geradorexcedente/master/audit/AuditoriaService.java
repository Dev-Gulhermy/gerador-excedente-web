package com.geradorexcedente.master.audit;

import org.springframework.stereotype.Service;

@Service
public class AuditoriaService {

    private final AuditoriaDAO auditoriaDAO;

    AuditoriaService(AuditoriaDAO auditoriaDAO) {
        this.auditoriaDAO = auditoriaDAO;
    }

    /*
     * =============================================
     * 📜 SERVIÇO DE AUDITORIA
     * =============================================
     *
     * Responsável por:
     * - Centralizar logs administrativos
     * - Registrar ações críticas
     * - Melhorar rastreabilidade
     * - Facilitar monitoramento
     *
     * =============================================
     */

    public void log(
            Long usuarioId,
            String usuarioEmail,
            String acao,
            String alvo,
            String detalhes,
            String ip,
            String userAgent,
            String resultado) {

        auditoriaDAO.salvar(
                usuarioId,
                usuarioEmail,
                acao,
                alvo,
                detalhes,
                ip,
                userAgent,
                resultado);
    }
}