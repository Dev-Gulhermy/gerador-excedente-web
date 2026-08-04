package com.geradorexcedente.master.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geradorexcedente.master.dto.DashboardDTO;
import com.geradorexcedente.master.service.MasterService;
import com.geradorexcedente.usuario.model.Usuario;

import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.servlet.http.HttpServletRequest;

/**
 * ================================================
 * 👑 MASTER CONTROLLER
 * ================================================
 * 
 * Endpoints administrativos do painel Master
 * 
 * Segurança:
 * - @PreAuthorize("hasRole('MASTER')") em todos
 * - Verifica autenticação JWT
 * - Registra auditoria
 * 
 * ================================================
 */
@RestController
@RequestMapping("/api/master")
@PreAuthorize("hasRole('MASTER')")
public class MasterController {

    private final MasterService masterService;

    MasterController(MasterService masterService) {
        this.masterService = masterService;
    }

    // ===============================
    // 📊 DASHBOARD
    // ===============================
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> dashboard() {

        return ResponseEntity.ok(
                masterService.buscarDashboard());
    }

    // ===============================
    // 👥 USUÁRIOS
    // ===============================
    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> usuarios() {

        return ResponseEntity.ok(
                masterService.listarUsuarios());
    }

    // ===============================
    // 🟢 SESSÕES
    // ===============================
    @GetMapping("/sessoes")
    public ResponseEntity<?> sessoes() {

        return ResponseEntity.ok(
                masterService.listarSessoes());
    }

    // ===============================
    // 📜 LOGS
    // ===============================
    @GetMapping("/logs")
    public ResponseEntity<?> logs() {

        return ResponseEntity.ok(
                masterService.listarLogs());
    }

    // ===============================
    // 🔒 BLOQUEAR USUÁRIO
    // ===============================
    @PostMapping("/bloquear/{id}")
    public ResponseEntity<?> bloquear(
            @PathVariable Long id,
            HttpServletRequest request) {

        masterService.bloquearUsuario(
                id,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));

        return ResponseEntity.ok().build();
    }

    // ===============================
    // ❌ DESATIVAR
    // ===============================
    @PostMapping("/desativar/{id}")
    public ResponseEntity<?> desativar(
            @PathVariable Long id,
            HttpServletRequest request) {

        masterService.desativarUsuario(
                id,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));

        return ResponseEntity.ok().build();
    }

    // ===============================
    // 🚪 FORÇAR LOGOUT
    // ===============================
    @PostMapping("/forcar-logout/{id}")
    public ResponseEntity<?> logout(
            @PathVariable Long id,
            HttpServletRequest request) {

        masterService.forcarLogout(
                id,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));

        return ResponseEntity.ok().build();
    }

    // ===============================
    // 🔑 RESETAR SENHA
    // ===============================
    @PostMapping("/resetar-senha/{id}")
    public ResponseEntity<?> resetarSenha(
            @PathVariable Long id) {

        String senha = masterService.resetarSenha(id);

        return ResponseEntity.ok(senha);
    }

    // ===============================
    // 👑 PROMOVER ADMIN
    // ===============================
    @PostMapping("/promover-admin/{id}")
    public ResponseEntity<?> promover(
            @PathVariable Long id,
            HttpServletRequest request) {

        masterService.promoverAdmin(
                id,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));

        return ResponseEntity.ok().build();
    }

    // ===============================
    // 🕵️ AUDITORIA
    // ===============================
    @GetMapping("/auditoria")
    public ResponseEntity<?> auditoria() {
        return ResponseEntity.ok(masterService.listarAuditoria());
    }

    // ===============================
    // 🔐 SEGURANÇA
    // ===============================
    @GetMapping("/seguranca")
    public ResponseEntity<?> seguranca() {
        return ResponseEntity.ok(masterService.obterSeguranca());
    }

    // ===============================
    // ⚙️ SISTEMA
    // ===============================
    @GetMapping("/sistema")
    public ResponseEntity<?> sistema() {
        return ResponseEntity.ok(masterService.obterSistema());
    }

    // ===============================
    // 🧩 CONFIGURAÇÕES
    // ===============================
    @GetMapping("/config")
    public ResponseEntity<?> configuracao() {
        return ResponseEntity.ok(masterService.obterConfiguracao());
    }
}