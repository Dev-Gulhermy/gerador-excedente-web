/**
 * ================================================
 * 👑 MASTER PANEL - MASTER.JS
 * ================================================
 *
 * Responsabilidade: Gerenciar navegação e interações do Master Panel
 *
 * Fluxo:
 * 1. Verificar autenticação MASTER via endpoint /auth/me
 * 2. Validar perfil retornado pelo backend
 * 3. Carregar Dashboard
 * 4. Carregar dados de cada aba dinamicamente
 * 5. Gerenciar ações (bloquear, logout, etc)
 *
 * Segurança:
 * - ✅ Verifica token e perfil MASTER
 * - ✅ Envia credenciais com requisições (cookies)
 * - ✅ Auto-logout se sessão expirar
 * - ✅ Sanitiza dados antes de inserir no DOM
 *
 * Monitoramento:
 * - Registra ações no console (debug)
 * - Captura e exibe erros
 * - Log estruturado de eventos
 *
 * ================================================
 */

// ================================================
// 🔧 CONFIGURAÇÃO
// ================================================

const API_BASE = "http://localhost:8080";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache de dados
const cache = {
  dashboard: { data: null, time: 0 },
  usuarios: { data: null, time: 0 },
  sessoes: { data: null, time: 0 },
  logs: { data: null, time: 0 },
  auditoria: { data: null, time: 0 },
  seguranca: { data: null, time: 0 },
  sistema: { data: null, time: 0 },
};

// Estado da aplicação
let abaAtiva = "dashboard";
let tokenExpirado = false;

// ================================================
// 🛡️ VERIFICAÇÃO DE AUTENTICAÇÃO
// ================================================

// quem diz se o usuário é MASTER é o Spring Boot, não o JavaScript.
async function verificarAutenticacao() {
  try {
    const usuario = await apiRequest("/auth/me");

    if (usuario.perfil !== "MASTER") {
      window.location.href = "login.html";

      return false;
    }

    console.log("👑 MASTER autenticado");

    return true;
  } catch (e) {
    console.error(e);

    window.location.href = "login.html";

    return false;
  }
}

// ================================================
// 📡 REQUISIÇÕES HTTP
// ================================================

/**
 * Faz requisição para API com tratamento de erro
 *
 * @param {string} endpoint - URL da API
 * @param {object} options - Opções do fetch
 * @returns {Promise<object>} Dados da resposta
 *
 * Segurança:
 * - Envia token no header Authorization
 * - Usa credentials: 'include' para cookies
 * - Auto-logout se 401 (sessão expirada)
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE + endpoint, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Envia cookies
      body: options.body ? JSON.stringify(options.body) : null,
    });

    // ⚠️ Sessão expirada
    if (response.status === 401) {
      console.warn("⚠️ Sessão expirada (401)");
      tokenExpirado = true;
      logout("Sua sessão expirou. Faça login novamente.");
      throw new Error("Sessão expirada");
    }

    // ❌ Erro servidor
    if (!response.ok) {
      const erro = await response.text();
      console.error("❌ Erro na API:", response.status, erro);
      throw new Error(`Erro ${response.status}: ${erro}`);
    }

    const data = await response.json();
    console.log("✅ Resposta recebida:", endpoint, data);
    return data;
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    mostrarErro("Erro ao conectar com servidor: " + error.message);
    throw error;
  }
}

// ================================================
// 🎯 NAVEGAÇÃO DE ABAS
// ================================================

/**
 * Abre uma aba do Master Panel
 *
 * @param {string} aba - ID da aba (dashboard, usuarios, etc)
 *
 * Fluxo:
 * 1. Esconde todas as abas
 * 2. Mostra a aba selecionada
 * 3. Atualiza título
 * 4. Carrega dados (com cache)
 */
function abrirAba(aba) {
  console.log("🔄 Abrindo aba:", aba);

  // Esconde todas as abas
  document.querySelectorAll(".pagina-master").forEach((el) => {
    el.classList.add("hidden");
  });

  // Mostra a aba selecionada
  const elemento = document.getElementById(aba);
  if (!elemento) {
    console.error("❌ Aba não encontrada:", aba);
    return;
  }

  elemento.classList.remove("hidden");
  abaAtiva = aba;

  // Atualiza título
  atualizarTitulo(aba);

  // Carrega dados
  carregarDadosAba(aba);
}

/**
 * Atualiza título da página
 */
function atualizarTitulo(aba) {
  const titulos = {
    dashboard: "📊 Dashboard",
    usuarios: "👥 Usuários",
    sessoes: "🟢 Sessões",
    logs: "📜 Logs",
    seguranca: "🔐 Segurança",
    sistema: "⚙️ Sistema",
    auditoria: "🕵️ Auditoria",
    config: "🧩 Configurações",
  };

  const titulo = document.getElementById("tituloPagina");
  if (titulo) {
    titulo.textContent = titulos[aba] || aba;
  }
}

// ================================================
// 📊 CARREGAR DADOS DAS ABAS
// ================================================

/**
 * Carrega dados da aba selecionada
 * Utiliza cache para melhor performance
 */
async function carregarDadosAba(aba) {
  try {
    // Mostra loading
    mostrarLoading(aba, true);

    switch (aba) {
      case "dashboard":
        await carregarDashboard();
        break;
      case "usuarios":
        await carregarUsuarios();
        break;
      case "sessoes":
        await carregarSessoes();
        break;
      case "logs":
        await carregarLogs();
        break;
      case "auditoria":
        await carregarAuditoria();
        break;
      case "seguranca":
        await carregarSeguranca();
        break;
      case "sistema":
        await carregarSistema();
        break;
      case "config":
        await carregarConfig();
        break;
    }

    mostrarLoading(aba, false);
  } catch (error) {
    console.error("❌ Erro ao carregar aba:", aba, error);
    mostrarLoading(aba, false);
  }
}

// ================================================
// 📊 DASHBOARD
// ================================================

/**
 * Carrega e exibe dashboard com métricas do sistema
 *
 * Métricas:
 * - Usuários online
 * - Total de usuários
 * - Memória JVM utilizada
 * - CPU do servidor
 */
async function carregarDashboard() {
  try {
    // Verifica cache
    if (
      cache.dashboard.data &&
      Date.now() - cache.dashboard.time < CACHE_DURATION
    ) {
      console.log("📦 Dashboard carregado do cache");
      renderizarDashboard(cache.dashboard.data);
      return;
    }

    // Busca dados
    const data = await apiRequest("/api/master/dashboard");

    // Salva cache
    cache.dashboard = {
      data: data,
      time: Date.now(),
    };

    renderizarDashboard(data);
  } catch (error) {
    console.error("❌ Erro ao carregar dashboard:", error);
    mostrarErro("Erro ao carregar dashboard");
  }
}

/**
 * Renderiza cards do dashboard
 */
function renderizarDashboard(data) {
  document.getElementById("usuariosOnline").textContent =
    data.usuariosOnline || 0;
  document.getElementById("usuariosTotal").textContent =
    data.usuariosTotal || 0;
  document.getElementById("memoriaJvm").textContent =
    formatarBytes(data.memoriaUsada || 0) +
    " / " +
    formatarBytes(data.memoriaMaxima || 0);
  document.getElementById("cpuServidor").textContent =
    `${data.cpu.toFixed(1)} %`;

  atualizarHistorico(data);

  atualizarGraficos();

  console.log("✅ Dashboard renderizado");
}

// =========================================
// 📈 HISTÓRICO DOS GRÁFICOS
// =========================================

const historico = {
  horarios: [],

  usuariosOnline: [],

  memoriaJvm: [],

  cpu: [],

  tempoMedio: [],

  rpm: [],

  statusHttp: {},

  logs: {},

  sessoes: {},
};

const MAX_PONTOS = 20;

const graficos = {
  usuarios: null,

  memoria: null,

  cpu: null,

  tempo: null,

  rpm: null,

  statusHttp: null,

  logs: null,

  sessoes: null,
};

function atualizarHistorico(data) {
  console.log("Dashboard recebido:", data);
  const agora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // =========================================
  // 📈 HISTÓRICO
  // =========================================

  historico.horarios.push(agora);

  historico.usuariosOnline.push(data.usuariosOnline);

  historico.memoriaJvm.push(data.memoriaUsada / 1024 / 1024);

  historico.cpu.push(data.cpu);

  historico.tempoMedio.push(data.tempoMedioRequisicoes);

  historico.rpm.push(data.requisicoesPorMinuto);

  // =========================================
  // 📊 SNAPSHOTS
  // =========================================

  historico.statusHttp = data.statusHttp;

  historico.logs = data.logs;

  historico.sessoes = data.sessoes;

  // =========================================
  // 🧹 LIMITE DO HISTÓRICO
  // =========================================

  if (historico.horarios.length > MAX_PONTOS) {
    historico.horarios.shift();

    historico.usuariosOnline.shift();

    historico.memoriaJvm.shift();

    historico.cpu.shift();

    historico.tempoMedio.shift();

    historico.rpm.shift();
  }
}

// =========================================
// 📊 INICIALIZAÇÃO DOS GRÁFICOS
// =========================================

/**
 * Cria os gráficos do Dashboard.
 *
 * IMPORTANTE:
 * Esta função é executada apenas uma vez,
 * evitando recriar o Chart.js a cada atualização.
 */
function inicializarGraficos() {
  criarGraficoUsuarios();

  criarGraficoMemoria();

  criarGraficoCpu();

  criarGraficoTempo();

  criarGraficoRpm();

  criarGraficoStatusHttp();

  criarGraficoLogs();

  criarGraficoSessoes();
}

//=========================================
// GrÁFICO USUÀRIOS
//=========================================
function criarGraficoUsuarios() {
  const ctx = document.getElementById("graficoUsuarios").getContext("2d");

  graficos.usuarios = new Chart(ctx, {
    type: "line",

    data: {
      labels: historico.horarios,

      datasets: [
        {
          label: "Usuários Online",

          data: historico.usuariosOnline,

          borderColor: "#00E5FF",

          backgroundColor: "rgba(0,229,255,.15)",

          fill: true,

          tension: 0.35,
        },
      ],
    },

    options: obterConfiguracaoPadrao("Usuários Online"),
  });
}

// -----------------------------------------
// 💾 GRÁFICO - MEMÓRIA JVM
// -----------------------------------------
function criarGraficoMemoria() {
  const ctxMemoria = document.getElementById("graficoMemoria").getContext("2d");

  graficos.memoria = new Chart(ctxMemoria, {
    type: "line",

    data: {
      labels: historico.horarios,

      datasets: [
        {
          label: "Memória JVM (MB)",

          data: historico.memoriaJvm,

          borderColor: "#8B5CF6",

          backgroundColor: "rgba(139,92,246,.15)",

          borderWidth: 3,

          fill: true,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 6,
        },
      ],
    },

    options: obterConfiguracaoPadrao("Memória JVM"),
  });
}

// =========================================
// 🖥️ GRÁFICO - CPU
// =========================================
function criarGraficoCpu() {
  const ctx = document.getElementById("graficoCpu").getContext("2d");

  graficos.cpu = new Chart(ctx, {
    type: "line",

    data: {
      labels: historico.horarios,

      datasets: [
        {
          label: "CPU (%)",

          data: historico.cpu,

          borderColor: "#10B981",

          backgroundColor: "rgba(16,185,129,.15)",

          borderWidth: 3,

          fill: true,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 6,
        },
      ],
    },

    options: obterConfiguracaoPadrao("Uso de CPU"),
  });
}

// =========================================
// ⏱️ GRÁFICO - TEMPO MÉDIO
// =========================================
function criarGraficoTempo() {
  const ctx = document.getElementById("graficoTempo").getContext("2d");

  graficos.tempo = new Chart(ctx, {
    type: "line",

    data: {
      labels: historico.horarios,

      datasets: [
        {
          label: "Tempo Médio (ms)",

          data: historico.tempoMedio,

          borderColor: "#F59E0B",

          backgroundColor: "rgba(245,158,11,.15)",

          borderWidth: 3,

          fill: true,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 6,
        },
      ],
    },

    options: obterConfiguracaoPadrao("Tempo Médio das Requisições"),
  });
}

// =========================================
// 🖥️ GRÁFICODE LOGS - LOGS
// =========================================
function criarGraficoLogs() {
  const ctx = document.getElementById("graficoLogs").getContext("2d");

  graficos.logs = new Chart(ctx, {
    type: "bar",

    data: {
      labels: ["INFO", "WARN", "ERROR", "DEBUG"],

      datasets: [
        {
          label: "Logs",

          data: [0, 0, 0, 0],

          backgroundColor: ["#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
        },
      ],
    },

    options: obterConfiguracaoPadrao("Logs"),
  });
}

// =========================================
// 🖥️ REQUISIÇÔES POR MINUTO - RPM
// =========================================
function criarGraficoRpm() {
  const ctx = document.getElementById("graficoRpm").getContext("2d");

  graficos.rpm = new Chart(ctx, {
    type: "line",

    data: {
      labels: historico.horarios,

      datasets: [
        {
          label: "RPM (%)",

          data: historico.cpu,

          borderColor: "#8110b9",

          backgroundColor: "rgba(129,16,185,.15)",

          borderWidth: 3,

          fill: true,

          tension: 0.35,

          pointRadius: 3,

          pointHoverRadius: 6,
        },
      ],
    },

    options: obterConfiguracaoPadrao("RPM - Requisições por Minuto"),
  });
}

// =========================================
// 🖥️ STATUS HTTP
// =========================================
function criarGraficoStatusHttp() {
  const ctx = document.getElementById("graficoStatusHttp").getContext("2d");

  graficos.statusHttp = new Chart(ctx, {
    type: "bar",

    data: {
      labels: ["200", "400", "401", "403", "404", "500"],

      datasets: [
        {
          label: "Status HTTP",

          data: [0, 0, 0, 0, 0, 0],

          backgroundColor: [
            "#10B981",
            "#F59E0B",
            "#F97316",
            "#EF4444",
            "#8B5CF6",
            "#DC2626",
          ],
        },
      ],
    },

    options: obterConfiguracaoPadrao("Status HTTP"),
  });
}

// =========================================
// 🔄 GRÁFICO SESSOES
// =========================================
function criarGraficoSessoes() {
  const ctx = document.getElementById("graficoSessoes").getContext("2d");

  graficos.sessoes = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: ["MASTER", "ADMIN", "USER"],

      datasets: [
        {
          data: [0, 0, 0],

          backgroundColor: ["#FFD700", "#3B82F6", "#10B981"],
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          labels: {
            color: "#FFF",
          },
        },
      },
    },
  });
}

// =========================================
// 🔄 ATUALIZAÇÃO DOS GRÁFICOS
// =========================================

/**
 * Atualiza os gráficos utilizando
 * o histórico armazenado em memória.
 */
function atualizarGraficos() {
  atualizarGraficoUsuarios();

  atualizarGraficoMemoria();

  atualizarGraficoCpu();

  atualizarGraficoTempo();

  atualizarGraficoRpm();

  atualizarGraficoStatusHttp();

  atualizarGraficoLogs();

  atualizarGraficoSessoes();
}

// =========================================
// 🔄 Atualizar USUARIOS
// =========================================
function atualizarGraficoUsuarios() {
  if (!graficos.usuarios) return;

  // Atualiza gráfico de usuários

  graficos.usuarios.data.labels = historico.horarios;

  graficos.usuarios.data.datasets[0].data = historico.usuariosOnline;

  graficos.usuarios.update();
}

// =========================================
// 🔄 Atualizar MEMORIA
// =========================================
function atualizarGraficoMemoria() {
  // Atualiza gráfico de memória

  graficos.memoria.data.labels = historico.horarios;

  graficos.memoria.data.datasets[0].data = historico.memoriaJvm;

  graficos.memoria.update();
}

// =========================================
// 🔄 Atualizar CPU
// =========================================
function atualizarGraficoCpu() {
  if (!graficos.cpu) return;

  graficos.cpu.data.labels = historico.horarios;

  graficos.cpu.data.datasets[0].data = historico.cpu;

  graficos.cpu.update();
}

// =========================================
// 🔄 Atualizar Tempo Médio
// =========================================
function atualizarGraficoTempo() {
  if (!graficos.tempo) return;

  graficos.tempo.data.labels = historico.horarios;

  graficos.tempo.data.datasets[0].data = historico.tempoMedio;

  graficos.tempo.update();
}

// =========================================
// 🔄 Atualizar RPM
// =========================================
function atualizarGraficoRpm() {
  if (!graficos.rpm) return;

  graficos.rpm.data.labels = historico.horarios;

  graficos.rpm.data.datasets[0].data = historico.rpm;

  graficos.rpm.update();
}

function atualizarGraficoStatusHttp() {
  if (!graficos.statusHttp) return;

  graficos.statusHttp.data.datasets[0].data = [
    historico.statusHttp.status200 || 0,

    historico.statusHttp.status400 || 0,

    historico.statusHttp.status401 || 0,

    historico.statusHttp.status403 || 0,

    historico.statusHttp.status404 || 0,

    historico.statusHttp.status500 || 0,
  ];

  graficos.statusHttp.update();
}

function atualizarGraficoLogs() {
  if (!graficos.logs) return;

  graficos.logs.data.datasets[0].data = [
    historico.logs.info || 0,
    historico.logs.warn || 0,
    historico.logs.error || 0,
    historico.logs.debug || 0,
  ];

  graficos.logs.update();
}

function atualizarGraficoSessoes() {
  if (!graficos.sessoes) return;

  graficos.sessoes.data.datasets[0].data = [
    historico.sessoes.master || 0,

    historico.sessoes.admin || 0,

    historico.sessoes.usuario || 0,
  ];

  graficos.sessoes.update();
}

// =========================================
// ⚙️ CONFIGURAÇÃO PADRÃO DOS GRÁFICOS
// =========================================

/**
 * Configuração compartilhada entre todos
 * os gráficos do Dashboard.
 *
 * Facilita futuras alterações.
 */
function obterConfiguracaoPadrao(titulo) {
  return {
    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      intersect: false,

      mode: "index",
    },

    plugins: {
      legend: {
        labels: {
          color: "#FFFFFF",
        },
      },

      title: {
        display: true,

        text: titulo,

        color: "#FFFFFF",

        font: {
          size: 16,

          weight: "bold",
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: "#A1A1AA",
        },

        grid: {
          color: "rgba(255,255,255,.05)",
        },
      },

      y: {
        beginAtZero: true,

        ticks: {
          color: "#A1A1AA",
        },

        grid: {
          color: "rgba(255,255,255,.05)",
        },
      },
    },
  };
}

// ================================================
// 👥 USUÁRIOS
// ================================================

/**
 * Carrega lista de usuários
 */
async function carregarUsuarios() {
  try {
    // Verifica cache
    if (
      cache.usuarios.data &&
      Date.now() - cache.usuarios.time < CACHE_DURATION
    ) {
      console.log("📦 Usuários carregados do cache");
      renderizarUsuarios(cache.usuarios.data);
      return;
    }

    // Busca dados
    const usuarios = await apiRequest("/api/master/usuarios");

    // Salva cache
    cache.usuarios = {
      data: usuarios,
      time: Date.now(),
    };

    renderizarUsuarios(usuarios);
  } catch (error) {
    console.error("❌ Erro ao carregar usuários:", error);
  }
}

/**
 * Renderiza tabela de usuários
 */
function renderizarUsuarios(usuarios) {
  const tabela = document.getElementById("tbodyUsuarios");
  if (!tabela) return;

  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    tabela.innerHTML =
      '<tr><td colspan="7" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
    return;
  }

  tabela.innerHTML = usuarios
    .map(
      (u) => `
        <tr>
            <td>${u.id || "—"}</td>
            <td>${sanitizar(u.nome || "—")}</td>
            <td>${sanitizar(u.email || "—")}</td>
            <td>${u.perfil || "USER"}</td>
            <td>${u.ativo ? "✅ Ativo" : "❌ Inativo"}</td>
            <td>${u.online ? "🟢 Online" : "⚫ Offline"}</td>
            <td class="acoes-cell">
                ${
                  u.perfil !== "MASTER"
                    ? `
                    <button onclick="bloquearUsuario(${u.id})" class="btn-sm btn-warn">🔒 Bloquear</button>
                    <button onclick="forcarLogout(${u.id})" class="btn-sm btn-info">🚪 Logout</button>
                    <button onclick="desativarUsuario(${u.id})" class="btn-sm btn-danger">❌ Desativar</button>
                `
                    : '<span style="color: var(--neon-yellow);">👑 MASTER</span>'
                }
            </td>
        </tr>
    `,
    )
    .join("");

  console.log("✅ Usuários renderizados:", usuarios.length);
}

// ================================================
// 🟢 SESSÕES
// ================================================

/**
 * Carrega lista de sessões ativas
 */
async function carregarSessoes() {
  try {
    const sessoes = await apiRequest("/api/master/sessoes");
    console.log("Sessões:", sessoes);

    // TODO: Implementar renderização de sessões
  } catch (error) {
    console.error("❌ Erro ao carregar sessões:", error);
  }
}

// ================================================
// 📜 LOGS
// ================================================

/**
 * Carrega logs da aplicação
 */
async function carregarLogs() {
  try {
    const logs = await apiRequest("/api/master/logs");
    console.log("Logs:", logs);

    // TODO: Implementar renderização de logs
  } catch (error) {
    console.error("❌ Erro ao carregar logs:", error);
  }
}

// ================================================
// 🕵️ AUDITORIA
// ================================================

/**
 * Carrega registros de auditoria
 */
async function carregarAuditoria() {
  try {
    // TODO: Implementar endpoint /api/master/auditoria
    console.log("⏳ Auditoria em desenvolvimento");
  } catch (error) {
    console.error("❌ Erro ao carregar auditoria:", error);
  }
}

// ================================================
// 🔐 SEGURANÇA
// ================================================

/**
 * Carrega dados de segurança
 */
async function carregarSeguranca() {
  try {
    // TODO: Implementar endpoint /api/master/seguranca
    console.log("⏳ Segurança em desenvolvimento");
  } catch (error) {
    console.error("❌ Erro ao carregar segurança:", error);
  }
}

// ================================================
// ⚙️ SISTEMA
// ================================================

/**
 * Carrega métricas do sistema
 */
async function carregarSistema() {
  try {
    // TODO: Implementar endpoint /api/master/sistema
    console.log("⏳ Sistema em desenvolvimento");
  } catch (error) {
    console.error("❌ Erro ao carregar sistema:", error);
  }
}

// ================================================
// 🧩 CONFIGURAÇÕES
// ================================================

/**
 * Carrega configurações do sistema
 */
async function carregarConfig() {
  try {
    // TODO: Implementar endpoint /api/master/config
    console.log("⏳ Configurações em desenvolvimento");
  } catch (error) {
    console.error("❌ Erro ao carregar configurações:", error);
  }
}

// ================================================
// 🔒 AÇÕES DE ADMINISTRADOR
// ================================================

/**
 * Bloqueia um usuário
 */
async function bloquearUsuario(id) {
  if (!confirm("⚠️ Tem certeza que deseja bloquear este usuário?")) {
    return;
  }

  try {
    await apiRequest(`/api/master/bloquear/${id}`, { method: "POST" });
    alert("✅ Usuário bloqueado com sucesso");

    // Atualiza cache
    cache.usuarios.data = null;
    cache.usuarios.time = 0;

    // Recarrega
    await carregarUsuarios();
  } catch (error) {
    console.error("❌ Erro ao bloquear usuário:", error);
  }
}

/**
 * Força logout de um usuário
 */
async function forcarLogout(id) {
  if (!confirm("⚠️ Tem certeza que deseja forçar logout?")) {
    return;
  }

  try {
    await apiRequest(`/api/master/forcar-logout/${id}`, { method: "POST" });
    alert("✅ Logout forçado com sucesso");

    // Atualiza cache
    cache.usuarios.data = null;
    cache.usuarios.time = 0;

    // Recarrega
    await carregarUsuarios();
  } catch (error) {
    console.error("❌ Erro ao forçar logout:", error);
  }
}

/**
 * Desativa um usuário
 */
async function desativarUsuario(id) {
  if (!confirm("⚠️ Tem certeza que deseja desativar este usuário?")) {
    return;
  }

  try {
    await apiRequest(`/api/master/desativar/${id}`, { method: "POST" });
    alert("✅ Usuário desativado com sucesso");

    // Atualiza cache
    cache.usuarios.data = null;
    cache.usuarios.time = 0;

    // Recarrega
    await carregarUsuarios();
  } catch (error) {
    console.error("❌ Erro ao desativar usuário:", error);
  }
}

// ================================================
// 🔓 LOGOUT
// ================================================

/**
 * Faz logout do sistema
 */
function logout(motivo = "") {
  console.log("🚪 Logout solicitado:", motivo);

  // Redireciona
  if (motivo) {
    alert(motivo);
  }
  window.location.href = "login.html";
}

// ================================================
// 🔧 UTILITÁRIOS
// ================================================

/**
 * Sanitiza string para evitar XSS
 */
function sanitizar(texto) {
  if (!texto) return "";

  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Formata bytes em unidade legível
 */
function formatarBytes(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Mostra/esconde loading em uma aba
 */
function mostrarLoading(aba, mostrar) {
  const elemento = document.getElementById(aba);
  if (!elemento) return;

  if (mostrar) {
    elemento.style.opacity = "0.5";
    elemento.style.pointerEvents = "none";
  } else {
    elemento.style.opacity = "1";
    elemento.style.pointerEvents = "auto";
  }
}

/**
 * Exibe mensagem de erro
 */
function mostrarErro(mensagem) {
  const modal = document.getElementById("modalGlobal");
  if (!modal) return;

  document.getElementById("modalTitulo").textContent = "❌ Erro";
  document.getElementById("modalBody").textContent = mensagem;

  modal.classList.remove("hidden");
}

/**
 * Fecha modal global
 */
function fecharModal() {
  const modal = document.getElementById("modalGlobal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Exporta auditoria em CSV
 */
function exportarAuditoria() {
  console.log("📥 Exportando auditoria...");
  // TODO: Implementar download de audit.csv
  alert("⏳ Funcionalidade em desenvolvimento");
}

/**
 * Exporta logs em CSV
 */
function exportarLogs() {
  console.log("📥 Exportando logs...");
  // TODO: Implementar download de logs.csv
  alert("⏳ Funcionalidade em desenvolvimento");
}

// ================================================
// 🚀 INICIALIZAÇÃO
// ================================================

/**
 * Inicializa Master Panel
 */
async function inicializar() {
  console.log("🚀 Iniciando Master Panel...");

  const autorizado = await verificarAutenticacao();

  if (!autorizado) {
    return;
  }

  inicializarGraficos();

  abrirAba("dashboard");

  setInterval(() => {
    if (abaAtiva === "dashboard") {
      cache.dashboard.data = null;

      carregarDashboard();
    }
  }, 5000);
}

// Executa ao carregar a página
document.addEventListener("DOMContentLoaded", inicializar);
