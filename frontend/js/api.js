//==========================================
//BASE URL AUTOMÁTICA
//==========================================
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:8080"
    : "https://gerador-excedente-web.onrender.com";

//const API_BASE = "http://localhost:8080";

// ==========================================
// 🔁 FUNÇÃO AUXILIAR PARA OBTER COOKIE (APENAS PARA INFORMAÇÕES NÃO SENSÍVEIS)
// ==========================================
// REMOVIDO: Acesso direto a cookies HttpOnly não é permitido para segurança.
// As credenciais serão enviadas automaticamente pelo navegador.
// ==========================================
// 📡 REQUEST PADRÃO COM RETRY + AUTH
// ==========================================
async function apiRequest(endpoint, options = {}) {
  // ==========================================
  // 🔁 CHAMADA CENTRALIZADA
  // Aqui acontece:
  // - inclusão do token
  // - refresh automático
  // - retry em caso de erro
  // ==========================================
  const response = await fetchWithAuthRetry(API_BASE + endpoint, {
    ...options,
    credentials: "include", // Adicionado para enviar cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // ==========================================
  // ❌ ERRO REAL (NÃO AUTH)
  // ==========================================
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }

  // ==========================================
  // 📦 TRATAMENTO DE RESPOSTA
  // ==========================================
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();

    // ==========================================
    // SALVA TOKEN E USUÁRIO E PERFIL
    // Essa seção foi removida pois os tokens são HttpOnly Cookies
    // e as informações do usuário devem ser obtidas de forma segura.
    // ==========================================

    // if (data.token) {
    //     localStorage.setItem("token", data.token);
    // }

    // if (data.refreshToken) {
    //     localStorage.setItem("refreshToken", data.refreshToken);
    // }

    // if (data.perfil) {
    //     localStorage.setItem("perfil", data.perfil);
    // }

    // // nome do usuário (depende do retorno do backend)
    // if (data.nome) {
    //     localStorage.setItem("usuario", data.nome);
    // }

    return data;
  }

  return response.text();
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
