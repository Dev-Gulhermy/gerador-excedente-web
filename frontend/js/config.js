// ==========================================
// ⚙️ CONFIGURAÇÃO DA APLICAÇÃO
// ==========================================
//
// Centraliza configurações utilizadas
// por todo o frontend.
//
// ==========================================

const APP_CONFIG = {
  API_BASE: API_BASE,

  IS_DEV:
    location.hostname === "localhost" || location.hostname === "127.0.0.1",

  SESSION: {
    authenticated: false,

    user: null,

    debug: false,
  },
};
