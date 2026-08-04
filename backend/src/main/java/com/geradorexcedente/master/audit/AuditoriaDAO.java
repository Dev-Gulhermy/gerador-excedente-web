package com.geradorexcedente.master.audit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuditoriaDAO {

        private final JdbcTemplate jdbcTemplate;

        AuditoriaDAO(JdbcTemplate jdbcTemplate) {
                this.jdbcTemplate = jdbcTemplate;
        }

        /*
         * =========================================
         * 💾 SALVAR AUDITORIA
         * =========================================
         *
         * Registra:
         *
         * - usuário
         * - ação
         * - alvo
         * - detalhes
         * - IP
         * - navegador
         * - resultado
         *
         */

        public void salvar(

                        Long usuarioId,

                        String usuarioEmail,

                        String acao,

                        String alvo,

                        String detalhes,

                        String ip,

                        String userAgent,

                        String resultado) {

                String sql = """
                                INSERT INTO auditoria
                                (
                                    usuario_id, usuario_email, acao, alvo, detalhes, ip, user_agent, resultado
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """;

                jdbcTemplate.update(

                                sql,

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