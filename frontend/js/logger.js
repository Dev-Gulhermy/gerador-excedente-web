// ============================================================
// 📝 LOGGER DA APLICAÇÃO
// ============================================================
//
// Responsabilidade:
//
// Centralizar todos os logs do frontend.
//
// Regras:
//
// • Logs de diagnóstico respeitam SESSION.debug
// • Erros permanecem visíveis
// • Evita quebrar a aplicação caso APP_CONFIG ainda não exista
// • Permite categorizar logs por área do sistema
//
// ============================================================

window.Logger = {
  // ========================================================
  // 🔐 VERIFICA SE LOGS DE DEBUG ESTÃO HABILITADOS
  // ========================================================
  //
  // Retorna true quando:
  //
  // • estamos em desenvolvimento
  // OU
  // • o usuário autenticado possui permissão MASTER
  //
  // As verificações defensivas são importantes porque
  // o Logger pode ser chamado antes da inicialização
  // completa do APP_CONFIG.
  //
  // ========================================================

  canDebug() {
    return Boolean(
      window.APP_CONFIG &&
      window.APP_CONFIG.SESSION &&
      window.APP_CONFIG.SESSION.debug,
    );
  },

  // ========================================================
  // ⚙️ EXECUTOR INTERNO
  // ========================================================
  //
  // Evita repetir a mesma lógica em:
  //
  // debug()
  // info()
  // warn()
  // table()
  // group()
  // etc.
  //
  // ========================================================

  execute(method, args) {
    if (!this.canDebug()) {
      return;
    }

    console[method](...args);
  },

  // ========================================================
  // 🐛 DEBUG
  // ========================================================

  debug(...args) {
    this.execute("log", args);
  },

  // ========================================================
  // ℹ️ INFORMAÇÃO
  // ========================================================

  info(...args) {
    this.execute("info", args);
  },

  // ========================================================
  // ⚠️ AVISO
  // ========================================================

  warn(...args) {
    this.execute("warn", args);
  },

  // ========================================================
  // ✅ SUCESSO
  // ========================================================

  success(...args) {
    this.execute("log", ["✅", ...args]);
  },

  // ========================================================
  // 📊 TABELA
  // ========================================================

  table(...args) {
    this.execute("table", args);
  },

  // ========================================================
  // 📂 GRUPO
  // ========================================================

  group(...args) {
    this.execute("group", args);
  },

  // ========================================================
  // 📂 GRUPO RECOLHIDO
  // ========================================================

  groupCollapsed(...args) {
    this.execute("groupCollapsed", args);
  },

  // ========================================================
  // 📁 FINALIZA GRUPO
  // ========================================================

  groupEnd() {
    if (!this.canDebug()) {
      return;
    }

    console.groupEnd();
  },

  // ========================================================
  // ❌ ERROS
  // ========================================================
  //
  // Erros permanecem visíveis mesmo em produção.
  //
  // IMPORTANTE:
  // Não registrar senhas, tokens, cookies ou informações
  // sensíveis nos argumentos.
  //
  // ========================================================

  error(...args) {
    console.error(...args);
  },

  // ========================================================
  // 🌐 API
  // ========================================================

  api(...args) {
    this.execute("log", ["🌐 API", ...args]);
  },

  // ========================================================
  // 🔐 AUTENTICAÇÃO
  // ========================================================

  auth(...args) {
    this.execute("log", ["🔐 AUTH", ...args]);
  },

  // ========================================================
  // 📦 CACHE
  // ========================================================

  cache(...args) {
    this.execute("log", ["📦 CACHE", ...args]);
  },

  // ========================================================
  // 📊 GRÁFICOS
  // ========================================================

  chart(...args) {
    this.execute("log", ["📊 CHART", ...args]);
  },

  // ========================================================
  // ⚡ PERFORMANCE
  // ========================================================

  performance(...args) {
    this.execute("log", ["⚡ PERFORMANCE", ...args]);
  },

  // ========================================================
  // 🛡️ SEGURANÇA
  // ========================================================

  security(...args) {
    this.execute("log", ["🛡️ SECURITY", ...args]);
  },

  // ========================================================
  // 📈 DASHBOARD
  // ========================================================
  dashboard(...args) {
    this.execute("log", ["📈 DASHBOARD", ...args]);
  },

  // ========================================================
  // 👑 DASHBOARD
  // ========================================================
  master(...args) {
    this.execute("log", ["👑 MASTER", ...args]);
  },
};
