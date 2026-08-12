//==========================================
//BASE URL AUTOMÁTICA
//==========================================
//globalThis.API_BASE =
//  location.hostname === "localhost"
//    ? "http://localhost:8080"
//    : "https://gerador-excedente-web.onrender.com";

globalThis.API_BASE = "http://localhost:8080";

// =========================================================
// 🌐 API REQUEST
// =========================================================
//
// Responsabilidade:
// Centralizar toda comunicação HTTP da aplicação.
//
// Esta é a ÚNICA função responsável por conversar
// com o backend.
//
// Nenhum outro arquivo deve utilizar fetch()
// diretamente.
//
// Utilizada por:
//
// • script.js
// • login.js
// • master.js
// • cadastro.js
// • qualquer outro módulo
//
// Recursos:
//
// ✅ Cookies HttpOnly
// ✅ Refresh automático
// ✅ Retry automático
// ✅ Logs padronizados
// ✅ Tratamento de erros
// ✅ JSON
// ✅ Texto
// ✅ Qualquer método HTTP
//
// =========================================================
async function apiRequest(endpoint, options = {}) {
  console.group(`🌐 API → ${endpoint}`);

  try {
    // =================================================
    // 🌍 URL FINAL
    // =================================================

    const url = API_BASE + endpoint;

    console.log("📤 Endpoint:", endpoint);
    console.log("🌍 URL:", url);

    // =================================================
    // ⚙ CONFIGURAÇÃO PADRÃO
    // =================================================

    const config = {
      method: options.method || "GET",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",

        ...(options.headers || {}),
      },

      body: options.body ?? undefined,
    };

    console.log("📡 Configuração:", config);

    // =================================================
    // 🚀 ENVIA REQUISIÇÃO
    // =================================================

    const response = await fetchWithAuthRetry(url, config);

    console.log(`📥 ${response.status} ${response.statusText}`);

    // =================================================
    // ❌ ERRO HTTP
    // =================================================

    if (!response.ok) {
      const erro = await response.text();

      console.error("❌ Erro HTTP");

      console.error("Status:", response.status);

      console.error("Mensagem:", erro);

      throw new Error(erro || `Erro HTTP ${response.status}`);
    }

    // =================================================
    // 📦 TIPO DA RESPOSTA
    // =================================================

    const contentType = response.headers.get("content-type");

    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // =================================================
    // ✅ LOG DA RESPOSTA
    // =================================================

    console.log(`✅ Resposta recebida (${endpoint})`);

    console.log(data);

    return data;
  } catch (error) {
    // =================================================
    // 🚨 ERRO GERAL
    // =================================================

    console.error("🚨 Falha na comunicação com a API");

    console.error(error);

    throw error;
  } finally {
    console.groupEnd();
  }
}

async function fetchWithAuthRetry(url, options = {}, isRetry = false) {
  console.log(
    "🔍 Iniciando fetchWithAuthRetry:",
    url,
    isRetry ? "(retry)" : "(primeira tentativa)",
  );

  console.log("🔍 Chamando:", url);

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });

  console.log("🔍 URL:", url, "STATUS:", response.status);

  console.log("📥 Resposta recebida:", response.status);

  // ==========================================
  // 401 = Não autenticado (token ausente/inválido)
  // ==========================================
  if (response.status === 401) {
    console.warn(
      "⚠️ Recebido 401 - Autenticação ausente, expirada ou inválida.",
    );

    if (!isRetry) {
      try {
        console.warn("🔄 Tentando renovar sessão...");

        await refreshToken();

        console.log("✅ Token renovado com sucesso. Refazendo requisição...");

        return fetchWithAuthRetry(url, options, true);
      } catch (err) {
        console.error("❌ Falha ao renovar sessão após 401:", err);

        console.error("🚨 Usuário não autenticado. Redirecionaria para login.");

        // window.location.href = "login.html";

        throw err;
      }
    }

    console.error("❌ Requisição já foi refeita e continua retornando 401.");

    throw new Error("Não autenticado (401)");
  }

  // ==========================================
  // 403 = Autenticado, mas sem permissão
  // ==========================================
  if (response.status === 403) {
    console.error(
      "⛔ Recebido 403 - Usuário autenticado, porém sem permissão para acessar o recurso.",
    );

    console.error(
      "🚫 A renovação de token não será tentada porque o problema é de autorização.",
    );

    throw new Error("Acesso negado (403)");
  }

  console.log("✅ Requisição concluída.");

  return response;
}

// ==========================================
// LOGIN (SEM TOKEN)
// ==========================================

async function apiLogin(endpoint, body) {
  const response = await fetch(API_BASE + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include", // Adicionado para enviar cookies e receber HttpOnly cookies
  });
  // ==========================================

  // Não processa mais JSON diretamente para tokens
  // O backend definirá HttpOnly Cookies
  // ==========================================
  if (!response.ok) {
    const errorData = await response.json(); // Tentar ler erro como JSON
    throw new Error(errorData.mensagem || "Email ou senha inválidos");
  }

  // Se a resposta for OK, assume que os cookies foram definidos
  // Não retorna dados sensíveis (tokens) ou os armazena no frontend
  // Se a resposta for OK, assume que os cookies foram definidos
  const contentType = response.headers.get("content-type");

  let data = {};

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  return {
    status: response.status,
    data: data,
  };
}

// ==========================================
// 📤 UPLOAD COM RETRY + REFRESH AUTOMÁTICO
// ==========================================
async function apiUpload(endpoint, formData, signal) {
  const response = await fetchWithAuthRetry(API_BASE + endpoint, {
    method: "POST",
    body: formData,
    signal,
  });

  // ==========================================
  // ❌ ERRO REAL DE REQUISIÇÃO
  // ==========================================
  if (!response.ok) {
    throw new Error("Erro no upload");
  }

  return response.json();
}
