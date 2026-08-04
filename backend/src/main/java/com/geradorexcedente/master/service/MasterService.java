package com.geradorexcedente.master.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.geradorexcedente.master.audit.AuditoriaService;
import com.geradorexcedente.master.dto.DashboardDTO;
import com.geradorexcedente.master.dto.SessoesDTO;
import com.geradorexcedente.master.metrics.HttpMetricsService;
import com.geradorexcedente.master.metrics.LogsService;
import com.geradorexcedente.master.metrics.PerformanceService;
import com.geradorexcedente.usuario.dao.UsuarioDAO;
import com.geradorexcedente.usuario.model.Usuario;
import com.geradorexcedente.usuario.model.Role;

/*
PerformanceService → coleta e armazena as métricas em memória.
MasterService → apenas monta o DashboardDTO utilizando essas métricas.
*/
@Service
public class MasterService {

        // logger deve ser declarado como atributo da classe, logo após a declaração da classe.
        private static final Logger logger =
            LoggerFactory.getLogger(MasterService.class);

        private final UsuarioDAO usuarioDAO;
        private final AuditoriaService auditoriaService;
        private final PerformanceService performanceService;
        private final HttpMetricsService httpMetricsService;
        private final LogsService logsService;

        MasterService(
                        AuditoriaService auditoriaService,
                        UsuarioDAO usuarioDAO,
                        PerformanceService performanceService,
                        HttpMetricsService httpMetricsService,
                        LogsService logsService) {

                this.auditoriaService = auditoriaService;
                this.usuarioDAO = usuarioDAO;
                this.performanceService = performanceService;
                this.httpMetricsService = httpMetricsService;
                this.logsService = logsService;
        }

        // ===================================
        // 📊 DASHBOARD
        // ===================================
        public DashboardDTO buscarDashboard() {

                logger.info("Teste Dashboard");

                DashboardDTO dto = new DashboardDTO();

                // =====================================================
                // 👥 USUÁRIOS
                // =====================================================

                dto.setUsuariosOnline(
                                usuarioDAO.totalOnline());

                dto.setUsuariosTotal(
                                usuarioDAO.totalUsuarios());

                dto.setUsuariosBloqueados(
                                usuarioDAO.totalBloqueados());

                // =====================================================
                // 💾 PERFORMANCE
                // =====================================================

                dto.setMemoriaUsada(
                                performanceService.memoriaUsada());

                dto.setMemoriaMaxima(
                                performanceService.memoriaMaxima());

                dto.setCpu(
                                performanceService.cpu());

                dto.setTempoMedioRequisicoes(
                                performanceService.tempoMedio());

                dto.setRequisicoesPorMinuto(
                                performanceService.requisicoesPorMinuto());

                // =====================================================
                // 📊 MÉTRICAS HTTP
                // =====================================================

                dto.setStatusHttp(
                                httpMetricsService.obterMetricas());

                // =====================================================
                // 📝 LOGS
                // =====================================================

                dto.setLogs(
                                logsService.obterLogs());

                // =====================================================
                // 👥 SESSÕES
                // =====================================================

                SessoesDTO sessoes = new SessoesDTO();

                usuarioDAO.listarSomenteOnline()
                                .forEach(usuario -> {
                                        switch (usuario.getPerfil()) {
                                                case MASTER -> sessoes.setMaster(sessoes.getMaster() + 1);
                                                case ADMIN -> sessoes.setAdmin(sessoes.getAdmin() + 1);
                                                case USER -> sessoes.setUsuario(sessoes.getUsuario() + 1);
                                                default -> {
                                                }
                                        }
                                });

                dto.setSessoes(sessoes);

                return dto;
        }

        // ===================================
        // � BLOQUEAR USUÁRIO
        // ===================================
        public void bloquearUsuario(
                        Long id,
                        String ip,
                        String userAgent) {

                Usuario usuario = usuarioDAO.buscarPorId(id);

                usuario.setBloqueadoAte(
                                LocalDateTime.now().plusYears(100));

                usuarioDAO.atualizar(usuario);

                // 📜 AUDITORIA
                auditoriaService.log(
                                usuario.getId(),
                                usuario.getEmail(),
                                "BLOQUEAR_USUARIO",
                                usuario.getEmail(),
                                "MASTER bloqueou usuário permanentemente",
                                ip,
                                userAgent,
                                "SUCCESS");
        }

        // ===================================
        // � LISTAR USUÁRIOS
        // ===================================
        public List<Usuario> listarUsuarios() {
                return usuarioDAO.listarTodos();
        }

        // ===================================
        // 📜 LISTAR LOGS
        // ===================================
        public Object listarLogs() {
                return "LOGS FUTURAMENTE";
        }

        // ================================================
        // 🟢 SESSÕES ATIVAS
        // ================================================

        /**
         * Lista todas as sessões ativas
         * Inclui: usuário, IP, device, último acesso
         */
        public List<Map<String, Object>> listarSessoes() {

                List<Map<String, Object>> sessoes = new ArrayList<>();

                List<Usuario> usuariosOnline = usuarioDAO.listarSomenteOnline();

                for (Usuario usuario : usuariosOnline) {
                        Map<String, Object> sessao = new HashMap<>();

                        sessao.put("usuario", usuario.getNome());
                        sessao.put("email", usuario.getEmail());
                        sessao.put("ip", usuario.getLastLoginIp() != null ? usuario.getLastLoginIp() : "N/A");
                        sessao.put("device", usuario.getLastUserAgent() != null ? usuario.getLastUserAgent() : "N/A");
                        sessao.put("ultimoAcesso", usuario.getUltimoAcesso());
                        sessao.put("status", "ONLINE");

                        sessoes.add(sessao);
                }

                return sessoes;
        }

        // ================================================
        // 🕵️ AUDITORIA
        // ================================================

        /**
         * Lista registros de auditoria
         * TODO: Integrar com AuditoriaDAO, paginação, filtros
         */
        public List<Map<String, Object>> listarAuditoria() {
                List<Map<String, Object>> auditoria = new ArrayList<>();
                // TODO: buscar do banco
                return auditoria;
        }

        // ================================================
        // 🔐 SEGURANÇA
        // ================================================

        /**
         * Obtém informações de segurança do sistema
         */
        public Map<String, Object> obterSeguranca() {

                Map<String, Object> seguranca = new HashMap<>();

                seguranca.put("politicaSenha", "Mínimo 8 caracteres, números e símbolos");
                seguranca.put("sessionTimeout", "1 hora");
                seguranca.put("rateLimiting", "Ativado");
                seguranca.put("cors", "Whitelist de domínios");
                seguranca.put("tentativasLoginFalhadas", 0);
                seguranca.put("ipsSuspeitos", new ArrayList<>());

                return seguranca;
        }

        // ================================================
        // ⚙️ SISTEMA
        // ================================================

        /**
         * Obtém métricas do sistema
         */
        public Map<String, Object> obterSistema() {

                Map<String, Object> sistema = new HashMap<>();

                Runtime runtime = Runtime.getRuntime();

                long memoriaTotalMb = runtime.totalMemory() / (1024 * 1024);
                long memoriaUsadaMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
                long memoriaMaximaMb = runtime.maxMemory() / (1024 * 1024);

                sistema.put("memoriaTotal", memoriaTotalMb + " MB");
                sistema.put("memoriaUsada", memoriaUsadaMb + " MB");
                sistema.put("memoriaMaxima", memoriaMaximaMb + " MB");

                ThreadGroup threadGroup = Thread.currentThread().getThreadGroup();
                sistema.put("threads", threadGroup.activeCount());
                sistema.put("processadores", Runtime.getRuntime().availableProcessors());

                return sistema;
        }

        // ================================================
        // 🧩 CONFIGURAÇÕES
        // ================================================

        /**
         * Obtém configurações do sistema
         */
        public Map<String, Object> obterConfiguracao() {

                Map<String, Object> config = new HashMap<>();

                config.put("apiVersion", "1.0.0");
                config.put("ambiente", "development");
                config.put("timestamp", LocalDateTime.now());
                config.put("features", new String[] {
                                "Dashboard",
                                "UserManagement",
                                "Auditoria",
                                "ExportCSV"
                });

                return config;
        }

        public void desativarUsuario(
                        Long id,
                        String ip,
                        String userAgent) {

                Usuario usuario = usuarioDAO.buscarPorId(id);

                usuarioDAO.desativar(id);

                // 📜 AUDITORIA
                auditoriaService.log(
                                usuario.getId(),
                                usuario.getEmail(),
                                "DESATIVAR_USUARIO",
                                usuario.getEmail(),
                                "MASTER desativou usuário",
                                ip,
                                userAgent,
                                "SUCCESS");
        }

        // ===================================
        // 🚪 FORÇAR LOGOUT
        // ===================================
        public void forcarLogout(
                        Long id,
                        String ip,
                        String userAgent) {

                Usuario usuario = usuarioDAO.buscarPorId(id);

                // 🔥 força logout
                usuarioDAO.setOffline(usuario.getEmail());

                // 🔥 invalida TODOS os tokens
                usuarioDAO.incrementarTokenVersion(id);

                // 📜 auditoria completa
                auditoriaService.log(
                                usuario.getId(),
                                usuario.getEmail(),
                                "FORCAR_LOGOUT",
                                usuario.getEmail(),
                                "MASTER forçou logout do usuário",
                                ip,
                                userAgent,
                                "SUCCESS");
        }

        // ===================================
        // 🔑 RESETAR SENHA
        // ===================================
        public String resetarSenha(Long id) {

                /*
                 * ⚠️ FUTURAMENTE:
                 * - gerar senha aleatória
                 * - enviar email
                 * - invalidar sessões
                 */

                return "123456";
        }

        // ===================================
        // 👑 PROMOVER ADMIN
        // ===================================
        public void promoverAdmin(
                        Long id,
                        String ip,
                        String userAgent) {

                Usuario usuario = usuarioDAO.buscarPorId(id);

                usuarioDAO.atualizarPerfil(
                                id,
                                Role.ADMIN);

                // 📜 AUDITORIA
                auditoriaService.log(
                                usuario.getId(),
                                usuario.getEmail(),
                                "PROMOVER_ADMIN",
                                usuario.getEmail(),
                                "MASTER promoveu usuário para ADMIN",
                                ip,
                                userAgent,
                                "SUCCESS");
        }
}