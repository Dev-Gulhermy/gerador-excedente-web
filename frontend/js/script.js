// ===============================
// 📦 ESTADO GLOBAL
// ===============================
let resultadosPorPlaca = {};
let arquivosPorResultado = {};

let placaAtual = null;
let resultadoAtualIndex = 0;

// Gráfico barra e pizza / tabela
let eventoSelecionado = null;

let cacheDadosBrutos = {};

// ===============================
// 📊 GRÁFICOS
// ===============================
let resultadoGraf = null;
let chartGraf = null;
let chartPizza = null; // 🔥 NOVO

let chartLinha = null;

// =============================
let aplicandoFiltro = false;

// ===============================
// 🧠 CACHE INTELIGENTE (NOVO)
// ===============================

// 🔥 guarda dados por placa sem reprocessar
let cacheResultadosProcessados = {};

// 🔥 cache de filtros (evita recalcular)
const cacheFiltros = new Map();

const { jsPDF } = window.jspdf;

let datasetSelecionado = null;

//====================================================================

// ==============================================
// 🆕 STATUS DAS PLACAS (APTO / NÃO APTO)
// ==============================================
let statusPlacas = {};
// 🔥 CARREGA STATUS SALVO (persistência)
const statusSalvo = localStorage.getItem("statusPlacas");
if (statusSalvo) {
  statusPlacas = JSON.parse(statusSalvo);
}

// ==============================================
// 🆕 DEFINIR STATUS (BOTÕES)
// ==============================================
function definirStatus(tipo) {
  if (!placaAtual) {
    alert("Selecione uma placa primeiro");
    return;
  }

  // salva status
  statusPlacas[placaAtual] = tipo;

  // 🔥 persistência
  localStorage.setItem("statusPlacas", JSON.stringify(statusPlacas));

  atualizarBotoesStatus();
  atualizarSelectPlacas();
  atualizarStatusTopo();
}

// ==============================================
// 🆕 ATUALIZA BOTÕES VISUALMENTE
// ==============================================
function atualizarBotoesStatus() {
  const btnApto = document.getElementById("btnApto");
  const btnNaoApto = document.getElementById("btnNaoApto");

  if (!btnApto || !btnNaoApto) return;

  btnApto.classList.remove("ativo");
  btnNaoApto.classList.remove("ativo");

  const status = statusPlacas[placaAtual];

  if (status === "APTO") btnApto.classList.add("ativo");
  if (status === "NAO_APTO") btnNaoApto.classList.add("ativo");

  atualizarStatusTopo();
}

function filtrarPorComunicacao(dados, tipo) {
  if (!tipo || tipo === "TODOS") return dados;

  return dados.filter((e) =>
    e.comunicacao?.toUpperCase().includes(tipo.toUpperCase()),
  );
}

//=============================================================

// ===============================
// 🛠️ FORMATADOR DE DATA
// ===============================
function formatarData(data) {
  if (!data) return "-";

  try {
    if (typeof data === "string" && data.includes("/")) return data;

    const d = new Date(data);

    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return data;
  }
}

// ==============================================
// 🚀 ENVIO CSV (COM CONTROLE DE UI + BLOQUEIO)
// (APENAS DISPARA PROCESSAMENTO)
// ==============================================
async function enviar() {
  const input = document.getElementById("csvFile");

  // ===============================
  // 🔒 ELEMENTOS DE CONTROLE UI
  // ===============================
  const btn = document.getElementById("btnProcessar");
  const textoBtn = document.getElementById("textoBtn");
  const loader = document.getElementById("loader");
  const progresso = document.getElementById("progresso");

  // ===============================
  // ⚠️ VALIDAÇÃO DE ARQUIVOS
  // ===============================
  if (!input.files.length) {
    alert("Selecione ao menos um CSV");
    return;
  }

  const files = [...input.files];
  const comunicacao = (
    document.getElementById("filtroComunicacao").value || ""
  ).toUpperCase();

  try {
    // ===============================
    // 🔒 BLOQUEIA BOTÃO (ANTI-SPAM)
    // ===============================
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";

    // ===============================
    // 🔄 ATIVA LOADER
    // ===============================
    loader.style.display = "inline-block";
    textoBtn.textContent = "Processando...";

    // ===============================
    // 📊 INICIALIZA PROGRESSO
    // ===============================
    progresso.innerText = `Processando 0 / ${files.length}`;

    // ===============================
    // 🚀 CHAMA A ENGINE CENTRAL
    // ===============================
    await processarArquivos(
      files,
      comunicacao,
      true, // limpa tudo no upload inicial
      null,
      3, // concorrência
    );

    // ===============================
    // ✅ FINALIZAÇÃO COM SUCESSO
    // ===============================
    textoBtn.textContent = "Processar CSV";
  } catch (erro) {
    // ===============================
    // ❌ TRATAMENTO DE ERRO
    // ===============================
    console.error("Erro no envio:", erro);
    textoBtn.textContent = "Erro";
  } finally {
    // ===============================
    // 🔓 LIBERA BOTÃO (SEMPRE EXECUTA)
    // ===============================
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";

    // ===============================
    // 🛑 DESATIVA LOADER
    // ===============================
    loader.style.display = "none";
  }
  atualizarStatusTopo();
}

// ===============================
// 🎯 FILTRO FRONTEND (GLOBAL FIX)
// ===============================
function aplicarFiltrosFrontend() {
  console.log(
    "CACHE",
    JSON.parse(JSON.stringify(cacheResultadosProcessados[placaAtual])),
  );
  if (!cacheResultadosProcessados[placaAtual]?.length) {
    console.warn("⚠️ Sem dados para placa atual");
    return;
  }

  console.count("aplicarFiltrosFrontend"); // 👈 AQUI

  // 🔒 trava anti-loop
  if (aplicandoFiltro) return;

  aplicandoFiltro = true;
  try {
    // ===============================
    // 🔽 SEU CÓDIGO ORIGINAL (INTEIRO)
    // ===============================

    if (!placaAtual) return;

    const comunicacao = (
      document.getElementById("filtroComunicacao").value || ""
    ).toUpperCase();
    const periodoIndex = document.getElementById("filtroPeriodo").value;

    const chaveCache = JSON.stringify({
      placa: placaAtual,
      comunicacao,
      periodoIndex,
      eventoSelecionado, // 🔥 ESSENCIAL
      tamanho: (cacheResultadosProcessados[placaAtual] || []).length, // 🔥 NOVO
    });

    if (cacheFiltros.has(chaveCache)) {
      renderizar(cacheFiltros.get(chaveCache));
      return;
    }

    let dadosOriginais = cacheResultadosProcessados[placaAtual] || [];

    let dados = [...dadosOriginais];

    // ===============================
    // 🔥 FILTRO COMUNICAÇÃO (ROBUSTO)
    // ===============================
    if (comunicacao) {
      dados = dados
        .map((d) => {
          // filtra eventos dentro do resultado
          const eventosFiltrados = d.eventos.filter((e) =>
            (e.comunicacao || "").toUpperCase().includes(comunicacao),
          );

          return {
            ...d,
            eventos: eventosFiltrados,
          };
        })
        .filter((d) => d.eventos.length > 0); // remove resultados vazios

      // 🚨 fallback inteligente (não quebra UI)
      if (!dados.length) {
        console.warn("⚠️ Nenhum dado com esse filtro de comunicação");
        dados = [];
      }
    }

    // ===============================
    // 📅 FILTRO PERÍODO
    // ===============================
    if (periodoIndex !== "" && dados[periodoIndex]) {
      dados = [dados[periodoIndex]];
    } else if (periodoIndex !== "") {
      console.warn("⚠️ Índice de período inválido após filtro");
      dados = [];
    }

    // ===============================
    // 🚨 PROTEÇÃO CONTRA VAZIO
    // ===============================
    if (!dados.length) {
      renderizar({
        placa: placaAtual,
        total: 0,
        eventos: [],
        dataInicio: null,
        dataFim: null,
        nomeArquivo: "-",
        intervaloTransmissao: "-",
      });
      return;
    }

    const resultado = agruparEventos(dados);

    cacheFiltros.set(chaveCache, resultado);

    renderizar(resultado);
  } finally {
    // Isso evita que o lock seja liberado no mesmo call stack, prevenindo recursão indireta.
    setTimeout(() => {
      aplicandoFiltro = false;
    }, 0); // 🔥 SOLTA FORA DA STACK
  }
}

function normalizarComunicacao(valor) {
  return (valor || "").toString().trim().toUpperCase();
}

function agruparEventos(lista) {
  let total = 0;
  const contagem = {};
  const timeline = []; // 🔥 NOVO

  let placa = placaAtual;
  let dataInicio = null;
  let dataFim = null;
  let nomeArquivo = "-";
  let intervalo = "-";

  lista.forEach((d) => {
    if (!Array.isArray(d.eventos)) return;

    if (!d || typeof d !== "object") return;

    nomeArquivo = d.nomeArquivo || nomeArquivo;
    intervalo = d.intervaloTransmissao || intervalo;

    if (!dataInicio || d.dataInicio < dataInicio) dataInicio = d.dataInicio;
    if (!dataFim || d.dataFim > dataFim) dataFim = d.dataFim;

    console.log("d:", d); // 👈 AQUI

    // 🔒 proteção eventos
    if (!Array.isArray(d.eventos)) {
      console.error("❌ eventos inválido:", d.eventos);
      return;
    }

    // 🔍 DETECTA LOOP EM EVENTOS
    if (d.eventos === d) {
      console.error("💣 LOOP DETECTADO: eventos aponta pra ele mesmo");
      return;
    }

    if (Array.isArray(d.eventosTimeline)) {
      for (let i = 0; i < d.eventosTimeline.length; i++) {
        const item = d.eventosTimeline[i];

        // 🔥 IGNORA estruturas contaminadas
        if (!item || typeof item !== "object") continue;

        // 💣 BLOQUEIA RECURSÃO OCULTA
        if (item.eventosTimeline) continue;

        // 💣 BLOQUEIA OBJETO PAI
        if (item === d) continue;

        // 🔥 LIMITE HARD (proteção real)
        if (timeline.length > 20000) {
          console.warn("⚠️ Timeline cortada (limite de segurança)");
          break;
        }

        timeline.push({
          nome: item.nome,
          data: item.data,
        });
      }
    }

    // 🔁 eventos (mantém como está)
    d.eventos.forEach((e) => {
      if (!e || !e.nome) return;

      if (!contagem[e.nome]) {
        contagem[e.nome] = {
          qtd: 0,
          comunicacao: e.comunicacao,
        };
      }

      contagem[e.nome].qtd += e.qtd || 0;
      total += e.qtd || 0;
    });
  });

  const eventos = Object.entries(contagem).map(([nome, info]) => ({
    nome,
    qtd: info.qtd,
    percentual: total ? (info.qtd / total) * 100 : 0,
    comunicacao: info.comunicacao, // 🔥 ESSENCIAL
  }));

  eventos.sort((a, b) => b.qtd - a.qtd);

  return {
    placa,
    total,
    eventos,
    eventosTimeline: timeline, // 🔥 AQUI ESTÁ A CORREÇÃO
    dataInicio,
    dataFim,
    nomeArquivo,
    intervaloTransmissao: intervalo,
  };
}

// ===============================
// 🌐 API UPLOAD (PADRÃO)
// ===============================
async function apiUpload(url, formData) {
  const response = await fetchWithAuthRetry(API_BASE + url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();

    // console.error("Erro API:", status, text);

    if (status === 401) {
      throw new Error("NAO_AUTENTICADO");
    }

    if (status === 403) {
      throw new Error("SEM_PERMISSAO");
    }

    throw new Error(`ERRO_API_${status}`);
  }

  return response.json();
}

// ===============================
// ⚙️ ENGINE DE PROCESSAMENTO (ÚNICA)
// ===============================
async function processarArquivos(
  listaArquivos,
  comunicacao,
  limparTudo = false,
  placaFiltro = null,
  concorrencia = 3,
) {
  if (!listaArquivos.length) {
    console.warn("Nenhum arquivo para processar");
    return;
  }

  // ===============================
  // 🧹 CONTROLE DE LIMPEZA
  // ===============================
  if (limparTudo) {
    resultadosPorPlaca = {};
    placaAtual = null;
  } else if (placaFiltro) {
    resultadosPorPlaca[placaFiltro] = [];
  }

  resultadoAtualIndex = 0;
  eventoSelecionado = null;

  let index = 0;
  let processados = 0;

  // ===============================
  // ⚙️ WORKER (NÃO REMOVER)
  // ===============================
  async function worker() {
    while (true) {
      let currentIndex;

      // 🔒 lock simples
      if (index >= listaArquivos.length) break;
      currentIndex = index++;

      const file = listaArquivos[currentIndex];

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("comunicacao", comunicacao);

        const data = await apiUpload("/api/excedente/processar", formData);

        console.log(data);

        // 🔥 LIMITADOR GLOBAL (aqui é o lugar certo)
        data.eventosTimeline = Array.isArray(data.eventosTimeline)
          ? data.eventosTimeline.slice(0, 5000)
          : [];

        // ✅ ATUALIZA PROGRESSO
        processados++;
        atualizarProgresso(processados, listaArquivos.length);

        data.comunicacao = normalizarComunicacao(data.comunicacao);
        // console.log("API RETORNO:", data);

        if (!data || !data.placa) {
          console.warn("Resposta inválida da API:", data);
          continue;
        }

        if (!cacheResultadosProcessados[data.placa]) {
          cacheResultadosProcessados[data.placa] = [];
        }

        cacheResultadosProcessados[data.placa].push(data);

        // console.log("CACHE:", cacheResultadosProcessados);

        // 🔥 mantém compatibilidade com sistema atual
        if (!resultadosPorPlaca[data.placa]) {
          resultadosPorPlaca[data.placa] = [];
        }

        data._id = `${data.placa}_${data.nomeArquivo}_${data.dataInicio}`;

        resultadosPorPlaca[data.placa].push(data);

        arquivosPorResultado[data._id] = file;

        if (!placaAtual) {
          placaAtual = data.placa;
        }
      } catch (err) {
        if (err.message === "NAO_AUTENTICADO") {
          alert("Sessão expirada. Faça login novamente.");
          localStorage.clear();
          window.location.href = "login.html";
          return;
        }

        if (err.message === "SEM_PERMISSAO") {
          alert("Você não tem permissão para essa ação.");
          return;
        }

        console.error("Erro ao processar:", err);
      }
    }
  }

  // ===============================
  // 🚀 CONTROLE DE CONCORRÊNCIA
  // ===============================
  const workers = Array.from({ length: concorrencia }, worker);
  await Promise.all(workers);

  // ===============================
  // 🔄 ATUALIZA UI
  // ===============================
  atualizarSelectPlacas();

  if (placaAtual) {
    document.getElementById("filtroPlaca").value = placaAtual;

    trocarPlaca(); // já chama carregarPeriodos internamente
    atualizarBotoesStatus();

    // 🔥 executa UMA única vez fora da stack
    setTimeout(() => {
      if (placaAtual && cacheResultadosProcessados[placaAtual]?.length) {
        aplicarFiltrosFrontend();
      }
    }, 0);
  }
}

// ===============================
// 🔄 FILTROS AGORA SÃO FRONTEND
// ===============================
document.getElementById("filtroComunicacao").addEventListener("change", () => {
  cacheFiltros.clear();
  aplicarFiltrosFrontend();
});

document
  .getElementById("filtroPeriodo")
  .addEventListener("change", aplicarFiltrosFrontend);

// ===============================
// 🔥 PROCESSAR TODOS (BOTÃO)
// ===============================
async function processarTodos() {
  const comunicacao = (
    document.getElementById("filtroComunicacao").value || ""
  ).toUpperCase();
  const arquivos = Object.values(arquivosPorResultado);

  if (!arquivos.length) {
    console.warn("Nenhum arquivo para processar");
    return;
  }

  await processarArquivos(arquivos, comunicacao, true, null, 3);
}

// ===============================
// 📂 NOME DOS ARQUIVOS
// ===============================
document.getElementById("csvFile").addEventListener("change", function () {
  document.getElementById("nomeArquivos").innerText = [...this.files]
    .map((f) => f.name)
    .join(", ");
});

// ===============================
// 🚗 SELECT PLACA (ATUALIZADO)
// ===============================
function atualizarSelectPlacas() {
  const select = document.getElementById("filtroPlaca");

  select.innerHTML = `<option value="">Selecione a placa</option>`;

  Object.keys(resultadosPorPlaca).forEach((placa) => {
    let status = statusPlacas[placa];
    let label = placa;

    if (status === "APTO") {
      label += " (Apto a Desconto)";
    }

    if (status === "NAO_APTO") {
      label += " (Não Apto a Desconto)";
    }

    select.innerHTML += `<option value="${placa}">${label}</option>`;
  });
}

// ===============================
// 🔁 TROCAR PLACA
// ===============================
function trocarPlaca() {
  const novaPlaca = document.getElementById("filtroPlaca").value;

  // 🚨 evita reprocessamento inútil
  if (novaPlaca === placaAtual) return;

  placaAtual = novaPlaca;

  if (!placaAtual) return;

  // 🔥 RESET CRÍTICO
  eventoSelecionado = null;
  datasetSelecionado = null;

  // 💣 LIMPA CACHE (ESSENCIAL)
  cacheFiltros.clear();

  atualizarBotoesStatus();
  carregarPeriodos();
  atualizarStatusTopo();

  // 🚀 FORÇA ATUALIZAÇÃO REAL
  setTimeout(() => {
    aplicarFiltrosFrontend();
  }, 0);
}

// ===============================
// 📅 PERÍODOS
// ===============================
function carregarPeriodos() {
  const select = document.getElementById("filtroPeriodo");
  select.innerHTML = `<option value="">Todos os períodos</option>`;

  const comunicacao = (
    document.getElementById("filtroComunicacao").value || ""
  ).toUpperCase();

  let lista = cacheResultadosProcessados[placaAtual] || [];

  if (comunicacao) {
    lista = lista.filter((d) => {
      const com = (d.comunicacao || "").toUpperCase().trim();
      return com.includes(comunicacao);
    });
  }
  if (!lista?.length) return;

  lista.forEach((r, i) => {
    select.innerHTML += `
      <option value="${i}">
        ${formatarData(r.dataInicio)} até ${formatarData(r.dataFim)}
        (${r.nomeArquivo})
      </option>
    `;
  });

  // 🔥 CORRETO (case sensitive)
  if (typeof atualizarStatusTopo === "function") {
    atualizarStatusTopo();
  }
}

// ===============================
// 🎯 RENDER
// ===============================
function renderizar(d) {
  // console.log("resultado final:", d);
  if (!d || !Array.isArray(d.eventos)) {
    console.warn("Dados inválidos para renderização");
    return;
  }

  resultadoGraf = d;

  // ===============================
  // 🧾 CARDS
  // ===============================
  document.getElementById("placa").innerText = d.placa;
  animarNumero(document.getElementById("total"), d.total);
  document.getElementById("intervalo").innerText =
    d.intervaloTransmissao || "-";

  const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);

  if (!eventosOrdenados || !eventosOrdenados.length) {
    console.warn("Sem dados ainda...");

    document.getElementById("principal").innerText = "-";
    return;
  }

  document.getElementById("principal").innerText =
    eventosOrdenados[0]?.nome ?? "-";

  document.getElementById("periodo").innerText =
    `${formatarData(d.dataInicio)} até ${formatarData(d.dataFim)}`;

  document.getElementById("arquivo").innerText = d.nomeArquivo ?? "-";

  // ===============================
  // 📊 TABELA
  // ===============================
  const tbody = document.getElementById("tabelaDados");
  tbody.innerHTML = "";

  eventosOrdenados.forEach((e, i) => {
    // ===============================
    // 🎯 CONTROLE DE LINHA ATIVA
    // ===============================
    const ativo = e.nome === eventoSelecionado;

    // ===============================
    // 🏆 RANKING TOP 3 EVENTOS
    // ===============================
    let ranking = "";

    if (i === 0)
      ranking = "🥇"; // 1º lugar
    else if (i === 1)
      ranking = "🥈"; // 2º lugar
    else if (i === 2) ranking = "🥉"; // 3º lugar

    // ===============================
    // 🧾 RENDERIZAÇÃO DA LINHA
    // ===============================
    tbody.innerHTML += `
    <tr class="
        ${ativo ? "linha-ativa" : ""} 
        ${i === 0 ? "top1 destaque-maximo" : ""}
        ${i < 3 ? "top3" : ""}
      "
      onclick="filtrarEventoGraf('${e.nome.replace(/'/g, "\\'")}')">

      <!-- ===============================
           🏆 EVENTO + RANKING
      =============================== -->
      <td>
        ${ranking ? `<span class="ranking">${ranking}</span>` : ""}
        ${e.nome}
      </td>

      <!-- ===============================
           🔢 QUANTIDADE
      =============================== -->
      <td>${e.qtd}</td>

      <!-- ===============================
           📊 BARRA VISUAL DE PERCENTUAL
      =============================== -->
      <td>
        <div class="barra-container">
          
          <div class="barra">
            <div style="width:${e.percentual}%"></div>
          </div>

          <span class="percentual-texto">
            ${e.percentual.toFixed(2)}%
          </span>

        </div>
      </td>

    </tr>
  `;
  });

  // ===============================
  // 📈 GRÁFICO (ULTRA EVOLUÍDO)
  // ===============================
  const wrapper = document.getElementById("graficoWrapper");
  const wrapperBarra = document.getElementById("graficoBarrasWrapper");
  const wrapperPizza = document.getElementById("graficoPizzaWrapper");
  const wrapperLinhaPai = document.getElementById("graficoLinhaWrapperPai");

  // ===============================
  // 🎯 FILTRA EVENTOS PARA GRÁFICO
  // ===============================
  const eventosGrafBarra = eventosOrdenados.slice(0, 12);

  // ===============================
  // 🚨 SEM DADOS → ESCONDE COM ANIMAÇÃO
  // ===============================
  if (!eventosGrafBarra.length) {
    wrapper.style.display = "none";
    return;
  }

  // ===============================
  // 🎬 ATIVA ANIMAÇÃO DO CONTAINER
  // ===============================
  // 🔥 só aparece quando tem dados
  if (!eventosGrafBarra.length) {
    wrapper.classList.remove("ativo");
    return;
  }

  wrapper.classList.add("ativo");
  // ===============================
  // 📊 GRÁFICO DE BARRA (MORPH REAL)
  // ===============================
  const ctx = document.getElementById("graficoBarras");

  // =======================================
  // 🎨 GRADIENTE DINÂMICO (PRIMARY → SECONDARY)
  // =======================================
  // ⚠️ Canvas exige criação via JS (não CSS)
  const ctx2d = ctx.getContext("2d");

  // Gradiente vertical (topo → base)
  const gradientBar = ctx2d.createLinearGradient(0, 0, 0, 300);
  gradientBar.addColorStop(0, "#00e5ff"); // primary
  gradientBar.addColorStop(1, "#7c3aed"); // secondary

  // Gradiente horizontal (borda)
  const gradientBorder = ctx2d.createLinearGradient(0, 0, 300, 0);
  gradientBorder.addColorStop(0, "#00e5ff");
  gradientBorder.addColorStop(1, "#7c3aed");

  if (window.ChartDataLabels && !window.__datalabelsRegistrado) {
    Chart.register(ChartDataLabels);

    window.__datalabelsRegistrado = true;
  }

  // =======================================
  // 🧠 CONTROLE DE HOVER (ANTI FLICKER)
  // =======================================
  if (!ctx.__hoverBound) {
    ctx.addEventListener("mouseenter", () => {
      if (window.__glowControl) {
        window.__glowControl.ativo = false;
      }
    });

    ctx.addEventListener("mouseleave", () => {
      if (window.__glowControl) {
        window.__glowControl.ativo = true;
      }
    });

    // 🔥 evita duplicar eventos a cada render
    ctx.__hoverBound = true;
  }

  // ===============================
  // 🔁 MORPH REAL (SEM DESTROY)
  // ===============================
  if (chartGraf) {
    // ===============================
    // 🔄 ATUALIZA DADOS (TRANSIÇÃO SUAVE)
    // ===============================
    chartGraf.data.labels = eventosGrafBarra.map((e) => formatarLabel(e.nome));
    chartGraf.data.datasets[0].data = eventosGrafBarra.map((e) => e.qtd);

    // 🔥 aplica gradiente também em updates
    chartGraf.data.datasets[0].backgroundColor = eventosGrafBarra.map((e) =>
      e.nome === eventoSelecionado ? "#00e5ff" : gradientBar,
    );
    chartGraf.data.datasets[0].borderColor = gradientBorder;

    chartGraf.options.plugins.title.text =
      eventoSelecionado || "Top 12 Eventos";

    chartGraf.update(); // 🔥 evita recalculo bugado
  } else {
    // ===============================
    // 🚀 CRIA GRÁFICO APENAS 1 VEZ
    // ===============================
    chartGraf = new Chart(ctx, {
      type: "bar",
      data: {
        labels: eventosGrafBarra.map((e) => formatarLabel(e.nome)),
        datasets: [
          {
            data: eventosGrafBarra.map((e) => e.qtd),

            // 🔥 cor inicial (será animada pelo glow)
            backgroundColor: eventosGrafBarra.map((e, i) => {
              if (e.nome === eventoSelecionado) return "#00e5ff";

              return gradientBar; // mantém o gradiente original
            }),
            borderColor: gradientBorder,
            borderWidth: 1,
            borderRadius: 6,
            hoverBorderWidth: 2,
            hoverBorderColor: "#00e5ff",
            hitRadius: 12, // 🔥 aumenta área de interação
            hoverRadius: 8, // 🔥 suaviza hover
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // 🔥 necessário para altura fixa
        events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
        // ===============================
        // 🎬 ANIMAÇÃO DE ENTRADA
        // ===============================
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
          delay: (ctx) => ctx.dataIndex * 60,
        },

        onClick: (event, elements) => {
          if (!elements.length) return;

          const index = elements[0].index;
          const nomeEvento = eventosGrafBarra[index]?.nome;

          if (!nomeEvento) return;

          // 🔥 TOGGLE GLOBAL ÚNICO
          const novo = eventoSelecionado === nomeEvento ? null : nomeEvento;

          // 🚨 evita reprocessamento desnecessário
          if (novo === eventoSelecionado) return;

          eventoSelecionado = novo;

          if (aplicandoFiltro) return;
          aplicarFiltrosFrontend();
        },

        scales: {
          x: {
            ticks: {
              callback: function (value) {
                const label = this.getLabelForValue(value);

                return Array.isArray(label) ? label : label.split(" ");
              },
              color: "#aaa",
              maxRotation: 0,
              minRotation: 0,
              // maxRotation: 45,
              // minRotation: 30
              align: "center",
              autoSkip: false, // 🔥 MOSTRA TODOS
              maxTicksLimit: 12,
              // autoSkip: true,          // 🔥 deixa o Chart respirar
              // maxTicksLimit: 10,        // 🔥 reduz densidade
              padding: 10, // 🔥 dá respiro
              font: {
                size: 10, // 🔥 diminui um pouco
              },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            grace: "10%", // 🔥 cria espaço acima das barras
            ticks: {
              color: "#aaa",
              padding: 8,
              callback: (value) => {
                return value.toLocaleString("pt-BR");
              },
            },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },

        interaction: {
          mode: "nearest",
          intersect: false,
        },

        plugins: {
          legend: { display: false },

          title: {
            display: true,
            text: eventoSelecionado || "Top 12 Eventos",
            color: "#00e5ff",
            font: { size: 14 },
          },
          // 🔥 AQUI ESTÁ O SEGREDO
          datalabels: {
            anchor: "end", // posiciona no topo
            align: "top", // acima da barra
            color: "#00e5ff",
            textShadowBlur: 6,
            textShadowColor: "#00e5ff",
            font: {
              weight: "bold",
              size: 12,
            },
            formatter: (value) => {
              return value.toLocaleString("pt-BR");
            },
          },

          tooltip: {
            backgroundColor: "#111",
            borderColor: "#7c3aed", // 🔥 leve ajuste para combinar com gradient
            borderWidth: 1,
            titleColor: "#7c3aed",
            bodyColor: "#fff",
          },
        },
      },
    });
  }

  function formatarLabel(nome) {
    const palavras = nome.split(" ");

    // 🔥 até 2 palavras → 1 linha
    if (palavras.length <= 2) return nome;

    // 🔥 3 a 4 palavras → 2 linhas
    if (palavras.length <= 4) {
      const meio = Math.ceil(palavras.length / 2);

      return [
        palavras.slice(0, meio).join(" "),
        palavras.slice(meio).join(" "),
      ];
    }

    // 🔥 5+ palavras → 3 linhas
    const parte = Math.ceil(palavras.length / 3);

    return [
      palavras.slice(0, parte).join(" "),
      palavras.slice(parte, parte * 2).join(" "),
      palavras.slice(parte * 2).join(" "),
    ];
  }

  // ===============================
  // 🥧 GRÁFICO DE PIZZA (COM GRADIENTE)
  // ===============================
  const ctxPizza = document.getElementById("graficoPizza");
  const eventosPizza = eventosOrdenados.slice(0, 12);

  // ===============================
  // 🎨 GERADOR DE CORES (ROXO → AZUL)
  // ===============================
  function gerarGradienteArray(total) {
    const cores = [];

    for (let i = 0; i < total; i++) {
      const ratio = i / total;

      // 🔥 AGORA: secondary (#7c3aed) → primary (#00e5ff)
      const r = Math.round(124 + (0 - 124) * ratio);
      const g = Math.round(58 + (229 - 58) * ratio);
      const b = Math.round(237 + (255 - 237) * ratio);

      cores.push(`rgb(${r}, ${g}, ${b})`);
    }

    return cores;
  }

  // ===============================
  // 🔁 MORPH PIZZA
  // ===============================
  if (chartPizza) {
    chartPizza.data.labels = eventosPizza.map((e) => e.nome);
    chartPizza.data.datasets[0].data = eventosPizza.map((e) => e.qtd);

    // 🎨 aplica gradiente no update
    const cores = gerarGradienteArray(eventosPizza.length);

    chartPizza.data.datasets[0].backgroundColor = eventosPizza.map((e, i) =>
      e.nome === eventoSelecionado ? "#00e5ff" : cores[i],
    );

    chartPizza.update();
  } else {
    // 🎨 aplica gradiente no update
    const cores = gerarGradienteArray(eventosPizza.length);
    chartPizza = new Chart(ctxPizza, {
      type: "doughnut",
      data: {
        labels: eventosPizza.map((e) => e.nome),
        datasets: [
          {
            data: eventosPizza.map((e) => e.qtd),

            backgroundColor: eventosPizza.map((e, i) =>
              e.nome === eventoSelecionado ? "#00e5ff" : cores[i],
            ),

            borderColor: "#0a0a0a",
            borderWidth: 1,
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",

        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
          easing: "easeOutExpo",
        },

        onClick: (event, elements) => {
          if (!elements.length) return;

          const index = elements[0].index;
          const nomeEvento = eventosPizza[index]?.nome;

          if (!nomeEvento) return;

          const novo = eventoSelecionado === nomeEvento ? null : nomeEvento;

          // 🚨 evita reprocessamento desnecessário
          if (novo === eventoSelecionado) return;

          eventoSelecionado = novo;

          if (aplicandoFiltro) return;
          aplicarFiltrosFrontend();
        },

        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#aaa",
              font: { size: 10 },
              padding: 10,
            },
          },

          title: {
            display: true,
            text: "Distribuição (%)",
            color: "#00e5ff",
            font: { size: 13 },
          },

          // 🔥 AQUI ESTÁ O AJUSTE
          datalabels: {
            color: "#fff",
            textStrokeColor: "#000",
            textStrokeWidth: 3, // 🔥 contorno preto
            textShadowBlur: 6,
            textShadowColor: "#000",

            font: {
              weight: "bold",
              size: 11,
            },

            formatter: (value, context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const porcentagem = (value / total) * 100;

              // 🔥 esconde valores muito pequenos
              if (porcentagem < 2) return "";

              return `${porcentagem.toFixed(1)}%`;
            },
          },

          tooltip: {
            backgroundColor: "#111",
            borderColor: "#7c3aed", // 🔥 leve ajuste para combinar com gradient
            borderWidth: 1,
            titleColor: "#7c3aed",
            bodyColor: "#fff",
          },
        },
      },
    });
  }
  console.log("Eventos para linha:", d.eventos.slice(0, 5));

  console.log(Object.keys(Chart.registry.plugins.items));
  // ===============================
  // 📈 GRÁFICO LINHA (INTEGRADO)
  // ===============================
  const ctxLinha = document.getElementById("graficoLinha");

  console.log("d:", d);
  console.log("timeline:", d.eventosTimeline);

  if (d.eventosTimeline && d.eventosTimeline.length) {
    wrapperLinhaPai.classList.add("ativo");
  } else {
    wrapperLinhaPai.classList.remove("ativo");
  }

  if (ctxLinha) {
    const timeline = Array.isArray(d.eventosTimeline) ? d.eventosTimeline : [];

    const timelineFiltrada = eventoSelecionado
      ? timeline.filter((e) => e.nome === eventoSelecionado)
      : timeline;

    // 🔥 se não tiver evento selecionado → mostra só TOP eventos
    const usarMultiplasLinhas = !eventoSelecionado;

    const multi = agruparMultiplasLinhas(timelineFiltrada);

    if (!multi.labels.length) {
      console.warn("Sem dados para gráfico de linha");
      return;
    }

    const mudouEstrutura =
      !chartLinha || chartLinha.data.labels.length !== multi.labels.length;

    if (chartLinha && !mudouEstrutura) {
      // ✅ UPDATE COM ANIMAÇÃO (SUAVE)
      chartLinha.data.labels = multi.labels;
      chartLinha.data.datasets = multi.datasets;

      chartLinha.update("active");
    } else {
      // 🔥 RECRIA (quando necessário)
      if (chartLinha) {
        chartLinha.destroy();
      }

      // 🔥 recria SEMPRE
      chartLinha = new Chart(ctxLinha, {
        type: "line",
        data: {
          display: false,
          labels: multi.labels,
          datasets: multi.datasets, // 🔥 CORRETO
        },
        options: {
          onClick: (evt, elements, chart) => {
            const points = chart.getElementsAtEventForMode(
              evt,
              "nearest",
              { intersect: false },
              true,
            );

            if (points.length) {
              const { datasetIndex } = points[0];

              // 🔁 toggle (clica de novo desmarca)
              datasetSelecionado =
                datasetSelecionado === datasetIndex ? null : datasetIndex;

              chart.update();
            }
          },
          responsive: true,
          maintainAspectRatio: false,

          // 🔥 FORÇA ANIMAÇÃO AO CRIAR
          animation: {
            duration: 800,
            easing: "easeInOutQuart",
          },

          transitions: {
            active: {
              animation: {
                duration: 500,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: "#aaa",
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 10,
                },
              },
            }, // 🔥 importante pra múltiplas linhas

            // 💣 DESATIVA OS NÚMEROS
            datalabels: {
              display: (context) => {
                // 🔥 mostra só se dataset estiver selecionado
                return context.datasetIndex === datasetSelecionado;
              },

              color: "#fff",
              font: {
                weight: "bold",
                size: 10,
              },

              align: "top",
              offset: 6,
            },

            title: {
              display: true,
              text: "Eventos ao longo do tempo",
              color: "#00e5ff",
            },

            tooltip: {
              callbacks: {
                title: (items) => {
                  const raw = items[0].label;
                },
                label: (context) => `${context.dataset.label}: ${context.raw}`,
              },
            },

            zoom: {
              pan: {
                enabled: true,
                mode: "x",
              },
              zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: "x",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#aaa",
                maxRotation: 0,
                autoSkip: true, // 🔥 ESSENCIAL
                maxTicksLimit: 10, // 🔥 controla densidade
              },
              grid: {
                display: false,
              },
            },
            y: {
              ticks: {
                color: "#aaa",
              },
              grid: {
                color: "rgba(255,255,255,0.05)",
              },
            },
          },
        },
      });
    }
  }
}

function filtrarEventoGraf(nomeEvento) {
  const novo = eventoSelecionado === nomeEvento ? null : nomeEvento;

  if (novo === eventoSelecionado) return;

  eventoSelecionado = novo;

  if (aplicandoFiltro) return;
  aplicarFiltrosFrontend();
}

function agruparPorData(eventos) {
  if (!eventos || !eventos.length) {
    console.warn("Sem timeline");
    return [];
  }

  const mapa = {};

  eventos.forEach((e) => {
    if (!e || !e.data) return;

    const partes = e.data.split(" ");
    if (!partes.length) return;

    const data = partes[0];

    if (!mapa[data]) {
      mapa[data] = 0;
    }

    mapa[data]++;
  });

  const resultado = Object.entries(mapa).map(([data, qtd]) => ({
    data,
    qtd,
  }));

  console.log("dadosTempo:", resultado);

  return resultado.sort((a, b) => new Date(a.data) - new Date(b.data));
}

function agruparMultiplasLinhas(eventos) {
  const mapa = {};

  eventos.forEach((e) => {
    if (!e?.data || !e?.nome) return;

    const hora = e.data.substring(0, 13) + ":00:00"; // ✅ ISO válido

    if (!mapa[hora]) mapa[hora] = {};

    if (!mapa[hora][e.nome]) mapa[hora][e.nome] = 0;

    mapa[hora][e.nome]++;
  });

  const labels = Object.keys(mapa).sort((a, b) => {
    const da = new Date(a.replace(" ", "T"));
    const db = new Date(b.replace(" ", "T"));
    return da - db;
  });

  const eventosUnicos = new Set();
  Object.values(mapa).forEach((obj) => {
    Object.keys(obj).forEach((nome) => eventosUnicos.add(nome));
  });

  const TOP = 8; // 🔥 ajuste aqui (3, 5 ou 7)

  const eventosOrdenados = Array.from(eventosUnicos)
    .map((nome) => {
      const total = labels.reduce(
        (acc, hora) => acc + (mapa[hora][nome] || 0),
        0,
      );
      return { nome, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP)
    .map((e) => e.nome);

  const cores = [
    "#00e5ff",
    "#7c3aed",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
  ];

  const datasets = eventosOrdenados.map((nome, i) => ({
    label: nome,
    data: labels.map((hora) => mapa[hora][nome] ?? null),
    borderColor: cores[i % cores.length],
    backgroundColor: cores[i % cores.length] + "33",
    borderWidth: 2,
    tension: 0.4,
    fill: false,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHitRadius: 10,
    spanGaps: true, // 🔥 evita linhas quebradas estranhas
  }));

  return { labels, datasets };
}

// =================================
// CONTADOR ANIMADO (KPIs)
// =================================
function animarNumero(elemento, valorFinal, duracao = 800) {
  let inicio = 0;
  const incremento = valorFinal / (duracao / 16);

  function atualizar() {
    inicio += incremento;

    if (inicio >= valorFinal) {
      elemento.innerText = valorFinal;
      return;
    }

    elemento.innerText = Math.floor(inicio);
    requestAnimationFrame(atualizar);
  }

  atualizar();
}

// ==========================================
// 🔄 RENOVAÇÃO DA SESSÃO (REFRESH TOKEN)
// ==========================================
// Esta função solicita ao backend a renovação da sessão.
//
// Fluxo:
//
// Access Token expirou
//          ↓
// POST /auth/refresh
//          ↓
// Backend valida Refresh Token (cookie HttpOnly)
//          ↓
// Backend gera novos cookies
//          ↓
// Requisições futuras voltam a funcionar
//
// Nenhum token é manipulado pelo JavaScript.
// Toda a autenticação ocorre através de cookies HttpOnly.
// ==========================================
async function refreshToken() {
  // Não é mais necessário ler o refresh token do localStorage.
  // O navegador enviará o HttpOnly cookie automaticamente.
  const response = await fetch(API_BASE + "/auth/refresh", {
    method: "POST",
    // Headers de autorização manual foram removidos; cookies serão enviados automaticamente.
    credentials: "include", // Importante para enviar cookies cross-origin
  });

  // Se o refresh falhar, considera a sessão inválida.
  if (!response.ok) {
    throw new Error("REFRESH_INVALIDO");
  }

  // Nesta implementação, o backend renova os cookies HttpOnly.
  // Portanto, o frontend não precisa receber ou armazenar tokens no corpo da resposta.
  // Assume-se que novos cookies foram definidos. Apenas retorna um indicador de sucesso ou dados não sensíveis, se houver.

  return true;
}

// ==========================================
// 🔁 FETCH COM RETRY AUTOMÁTICO
// ==========================================
//
// Responsabilidades:
//
// 1. Executar a requisição original
// 2. Enviar cookies automaticamente
// 3. Detectar sessão expirada
// 4. Solicitar refresh da sessão
// 5. Reexecutar a requisição original
//
// Parâmetro isRetry:
//
// false → primeira tentativa
// true  → requisição já refeita após refresh
//
// Isso evita loops infinitos caso o refresh falhe
// ou a sessão realmente tenha expirado.
// ==========================================
async function fetchWithAuthRetry(url, options = {}, isRetry = false) {
  //console.log("🔥 URL CHAMADA:", url);
  // Realiza a requisição normalmente. Não é mais necessário ler o token do localStorage.
  // O navegador enviará o HttpOnly cookie automaticamente. Porém, há um detalhes: O navegador só envairá os cookies associados ao domínio quando:
  // (-- credentials: "include" --) estiver presente em chamadas cross-origin.
  // 🔁 refaz a requisição já com novos cookies (enviados automaticamente).

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Essencial para envio de cookies em chamadas cross-origin.
    headers: {
      ...(options.headers || {}),
      // O Authorization header não é mais necessário, pois o token está em HttpOnly Cookie.
      // "Authorization": "Bearer " + token // REMOVIDO
    },
  });
  //console.log("🔥 STATUS:", response.status);
  // ==========================================
  // 🔐 SESSÃO EXPIRADA
  // ==========================================
  //
  // Caso o backend informe que a autenticação
  // não é mais válida (401 ou 403),
  // tenta renovar a sessão apenas uma vez.
  //
  // O !isRetry impede loops infinitos.
  // ==========================================

  //Uma observação final: eu verificaria no backend se o 403 realmente significa token expirado. Em APIs REST, normalmente:
  //401 Unauthorized  → token ausente, inválido ou expirado
  //403 Forbidden     → usuário autenticado, mas sem permissão
  //Se o seu backend segue esse padrão, o trecho ideal seria:
  //if (response.status === 401 && !isRetry)
  //Isso evita tentar refresh quando o problema é apenas falta de permissão para acessar determinado recurso.

  if ((response.status === 401 || response.status === 403) && !isRetry) {
    try {
      console.warn("🔄 Sessão expirada, tentando renovar...");

      // Solicita novos cookies ao backend.
      await refreshToken();

      // Refaz a mesma requisição original.
      //
      // O parâmetro true indica que já estamos
      // em uma segunda tentativa.
      //
      // Se ela falhar novamente, não será feito
      // novo refresh.
      return fetchWithAuthRetry(url, options, true);
    } catch (err) {
      console.error("❌ Falha na renovação da sessão", err);

      // Não limpa localStorage, pois tokens não estão lá. Apenas redireciona.
      // Refresh falhou.
      //
      // Considera que a sessão expirou
      // definitivamente e redireciona
      // o usuário para login.

      window.location.href = "login.html";

      // Retorna a resposta original caso esteja OK
      // ou caso não seja um erro de autenticação.
      throw err;
    }
  }

  return response;
}

// =====================================================
// 🎨 CONFIGURAÇÃO GLOBAL DE ESTILO (TEMA DARK POWER BI)
// =====================================================
const ESTILO = {
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2D2D44" } },
    alignment: { horizontal: "center", vertical: "center" },
  },
  texto: {
    font: { color: { rgb: "FFFFFF" } },
  },
  fundo: {
    fill: { fgColor: { rgb: "1E1E2F" } },
  },
};

// =====================================================
// 🎨 APLICA TEMA DARK EM TODA A ABA (SEM QUEBRAR ESTILOS)
// =====================================================
function aplicarTemaDark(ws) {
  if (!ws["!ref"]) return;

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

      if (!ws[cellRef]) continue;

      // 🔥 CORREÇÃO: mantém estilos anteriores
      ws[cellRef].s = {
        ...ws[cellRef].s,
        ...ESTILO.texto,
        ...ESTILO.fundo,
      };
    }
  }
}

// =====================================================
// 🦓 ZEBRA STRIPING (MELHORA LEITURA)
// =====================================================
function aplicarZebra(ws) {
  if (!ws["!ref"]) return;

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    if (R % 2 === 0) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });

        if (!ws[ref]) continue;

        ws[ref].s = {
          ...ws[ref].s,
          fill: { fgColor: { rgb: "26263A" } },
        };
      }
    }
  }
}

function destacarTop3(ws, colIndex, startRow) {
  const cores = ["FFD700", "C0C0C0", "CD7F32"]; // ouro, prata, bronze

  for (let i = 0; i < 3; i++) {
    const ref = XLSX.utils.encode_cell({ r: startRow + i, c: colIndex });

    if (!ws[ref]) continue;

    ws[ref].s = {
      ...ws[ref].s,
      font: { bold: true, color: { rgb: cores[i] } },
    };
  }
}

// =====================================================
// 📌 GRID PADRÃO (ALINHAMENTO PERFEITO)
// =====================================================
function aplicarGrid(ws) {
  if (!ws["!ref"]) return;

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        ...ws[cellRef].s,
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  }
}

// =====================================================
// 📈 RANKING COM CORES DINÂMICAS (HEATMAP)
// =====================================================
function aplicarRankingCores(ws, colIndex, startRow, endRow) {
  const valores = [];

  for (let R = startRow; R <= endRow; R++) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: colIndex })];
    if (cell && typeof cell.v === "number") valores.push(cell.v);
  }

  const max = Math.max(...valores);
  const min = Math.min(...valores);

  for (let R = startRow; R <= endRow; R++) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: colIndex });
    const cell = ws[cellRef];

    if (!cell || typeof cell.v !== "number") continue;

    const ratio = (cell.v - min) / (max - min || 1);

    let color;
    if (ratio > 0.7)
      color = "00C853"; // verde
    else if (ratio > 0.4)
      color = "FFAB00"; // amarelo
    else color = "FF5252"; // vermelho

    cell.s = {
      ...cell.s,
      fill: { fgColor: { rgb: color } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
    };
  }
}

// =====================================================
// 📊 BARRA DE PROGRESSO VISUAL (SEM QUEBRAR DADOS)
// =====================================================
function aplicarBarraProgresso(ws, colIndex, startRow, endRow) {
  for (let R = startRow; R <= endRow; R++) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: colIndex });
    const cell = ws[cellRef];

    if (!cell || typeof cell.v !== "number") continue;

    const valor = cell.v;

    const totalBlocos = 8;
    const preenchido = Math.round(valor * totalBlocos);

    const barra = "█".repeat(preenchido) + "░".repeat(totalBlocos - preenchido);

    let color;
    if (valor > 0.7) color = "00C853";
    else if (valor > 0.4) color = "FFAB00";
    else color = "FF5252";

    // 🔥 CORRETO: apenas altera o valor da célula atual
    cell.v = `${barra} ${(valor * 100).toFixed(1)}%`;

    cell.s = {
      ...cell.s,
      font: { color: { rgb: color }, bold: true },
      alignment: { horizontal: "left" },
    };
  }
}

// =====================================================
// 📤 EXPORTAÇÃO EXCEL
// =====================================================
function exportarExcel() {
  if (!Object.keys(resultadosPorPlaca).length) {
    alert("Nenhum dado para exportar");
    return;
  }

  const wb = XLSX.utils.book_new();

  gerarAbaResumo(wb);
  gerarAbaDados(wb);
  gerarAbaTopEventos(wb);

  XLSX.writeFile(wb, "relatorio_power_bi.xlsx");
}

// =====================================================
// 📊 ABA DASHBOARD (PRINCIPAL)
// =====================================================
function gerarAbaResumo(wb) {
  const ws = XLSX.utils.aoa_to_sheet([]);

  // =========================
  // 🎯 TÍTULO
  // =========================
  XLSX.utils.sheet_add_aoa(
    ws,
    [
      ["🚀 GERADOR DE EXCEDENTE"],
      ["Relatório Inteligente • Sistema Analítico"],
    ],
    { origin: "A1" },
  );

  ws["A1"].s = {
    font: { sz: 20, bold: true, color: { rgb: "00E5FF" } },
    alignment: { horizontal: "center" },
  };

  ws["A2"].s = {
    font: { sz: 12, color: { rgb: "9AA0A6" } },
    alignment: { horizontal: "center" },
  };

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  // =========================
  // 📊 KPI
  // =========================
  const statusGeral = Object.values(statusPlacas).includes("NAO APTO")
    ? "NAO APTO"
    : "APTO";

  XLSX.utils.sheet_add_aoa(ws, [["STATUS GERAL", statusGeral]], {
    origin: "A4",
  });

  const statusCell = ws["B4"];

  statusCell.s = {
    font: {
      bold: true,
      color: {
        rgb: statusGeral === "APTO" ? "00FF88" : "FF3B3B",
      },
    },
    fill: {
      fgColor: {
        rgb: statusGeral === "APTO" ? "002B1F" : "2B0000",
      },
    },
    alignment: { horizontal: "center" },
  };

  const totalPlacas = Object.keys(resultadosPorPlaca).length;

  let totalEventos = 0;
  Object.values(resultadosPorPlaca).forEach((arr) => {
    arr.forEach((d) => (totalEventos += d.total));
  });

  XLSX.utils.sheet_add_aoa(
    ws,
    [["TOTAL PLACAS", totalPlacas, "", "TOTAL EVENTOS", totalEventos]],
    { origin: "A3" },
  );

  // =========================
  // 📦 TABELA
  // =========================
  const dadosResumo = [
    ["PLACA", "TOTAL", "INTERVALO", "STATUS", "EVENTO PRINCIPAL", "%"],
  ];

  Object.keys(resultadosPorPlaca).forEach((placa) => {
    const d = resultadosPorPlaca[placa][0];

    const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);

    const principal = eventosOrdenados[0]?.nome || "-";
    const percentual = eventosOrdenados[0]?.percentual || 0;

    const status = statusPlacas[placa] || "NAO DEFINIDO";

    dadosResumo.push([
      placa,
      d.total,
      d.intervaloTransmissao,
      status,
      principal,
      percentual / 100,
    ]);
  });

  XLSX.utils.sheet_add_aoa(ws, dadosResumo, { origin: "A6" });

  // =========================
  // 🎨 HEADER
  // =========================
  for (let C = 0; C <= 5; C++) {
    const cell = XLSX.utils.encode_cell({ r: 5, c: C });
    if (ws[cell]) ws[cell].s = ESTILO.header;
  }

  // =========================
  // 📏 COLUNAS
  // =========================
  ws["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 28 },
  ];

  // =========================
  // 🔍 FILTRO
  // =========================
  ws["!autofilter"] = { ref: `A6:F${dadosResumo.length + 5}` };

  // =========================
  // 🎨 APLICAÇÕES VISUAIS
  // =========================
  // 🎨 ORDEM PROFISSIONAL DE ESTILIZAÇÃO
  aplicarTemaDark(ws); // base
  aplicarZebra(ws); // leitura
  aplicarGrid(ws); // alinhamento
  aplicarRankingCores(ws, 1, 6, dadosResumo.length + 5);
  aplicarBarraProgresso(ws, 5, 6, dadosResumo.length + 5);

  XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
}

// =====================================================
// 📦 ABA BASE DE DADOS
// =====================================================
function gerarAbaDados(wb) {
  const ws = XLSX.utils.aoa_to_sheet([]);

  const dados = [["PLACA", "EVENTO", "QTD", "%", "DATA INICIO", "DATA FIM"]];

  // =========================
  // 📥 MONTA DADOS
  // =========================
  Object.keys(resultadosPorPlaca).forEach((placa) => {
    resultadosPorPlaca[placa].forEach((d) => {
      d.eventos.forEach((e) => {
        dados.push([
          placa,
          e.nome,
          e.qtd,
          e.percentual / 100, // ✔ mantém número (não texto)
          d.dataInicio,
          d.dataFim,
        ]);
      });
    });
  });

  XLSX.utils.sheet_add_aoa(ws, dados, { origin: "A1" });

  // =========================
  // 🎨 HEADER
  // =========================
  for (let C = 0; C <= 5; C++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cell]) ws[cell].s = ESTILO.header;
  }

  // =========================
  // 🎯 FORMATA % CORRETAMENTE
  // =========================
  for (let R = 1; R < dados.length; R++) {
    const cellRef = XLSX.utils.encode_cell({ r: R, c: 3 }); // coluna %

    if (ws[cellRef]) {
      ws[cellRef].s = {
        ...ws[cellRef].s,
        numFmt: "0.0%", // 🔥 transforma 0.49 em 49.0%
      };
    }
  }

  // =========================
  // 📏 COLUNAS (AJUSTADAS)
  // =========================
  ws["!cols"] = [
    { wch: 15 }, // PLACA
    { wch: 35 }, // EVENTO
    { wch: 10 }, // QTD
    { wch: 12 }, // % (ajustado - sem barra aqui)
    { wch: 20 }, // DATA INICIO
    { wch: 20 }, // DATA FIM
  ];

  // =========================
  // 🔍 FILTRO
  // =========================
  ws["!autofilter"] = { ref: `A1:F${dados.length}` };

  // =========================
  // 🎨 APLICA TEMA (DEPOIS DO numFmt)
  // =========================
  // 🎨 ORDEM PROFISSIONAL DE ESTILIZAÇÃO
  aplicarTemaDark(ws); // base
  aplicarZebra(ws); // leitura
  aplicarGrid(ws); // alinhamento
  // =========================
  // 📎 ADICIONA ABA
  // =========================
  XLSX.utils.book_append_sheet(wb, ws, "Base_Dados");
}

// =====================================================
// 📈 ABA TOP EVENTOS (RANKING)
// =====================================================
function gerarAbaTopEventos(wb) {
  const ws = XLSX.utils.aoa_to_sheet([]);

  const dados = [["PLACA", "EVENTO", "QTD", "%"]];

  Object.keys(resultadosPorPlaca).forEach((placa) => {
    const d = resultadosPorPlaca[placa][0];

    const topEventos = [...d.eventos].sort((a, b) => b.qtd - a.qtd).slice(0, 6);

    topEventos.forEach((e) => {
      dados.push([placa, e.nome, e.qtd, e.percentual / 100]);
    });
  });

  XLSX.utils.sheet_add_aoa(ws, dados, { origin: "A1" });

  // header
  for (let C = 0; C <= 3; C++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cell]) ws[cell].s = ESTILO.header;
  }

  ws["!cols"] = [{ wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 28 }];

  ws["!autofilter"] = { ref: `A1:D${dados.length}` };

  // 🎨 ORDEM PROFISSIONAL DE ESTILIZAÇÃO
  aplicarTemaDark(ws); // base
  aplicarZebra(ws); // leitura
  aplicarGrid(ws); // alinhamento

  // 📈 ranking visual correto
  aplicarRankingCores(ws, 2, 1, dados.length - 1);
  aplicarBarraProgresso(ws, 3, 1, dados.length - 1);

  // ⭐ destaque top 3 (melhoria)
  destacarTop3(ws, 2, 1);

  XLSX.utils.book_append_sheet(wb, ws, "Top_Eventos");
}

// ========================
// EXPORTAR PDF (CHAMADA)
// ========================
function exportarPDF() {
  if (placaAtual) {
    exportarPDFDetalhado(); // 1 placa
  } else {
    exportarPDFGeral(); // todas
  }
}

// =============================
// PDF GERAL (TODAS AS PLACAS)
// =============================
function exportarPDFGeral() {
  const margem = 10;
  const pdf = new jsPDF();

  let pagina = 1;

  // 🔥 PRIMEIRA PÁGINA = RANKING
  adicionarCabecalho(pdf, "RELATORIO GERAL DE EXCEDENTE", margem);

  desenharRankingGlobal(pdf, resultadosPorPlaca, statusPlacas);

  // 🔥 nova página para placas individuais
  adicionarRodape(pdf, pagina++);
  pdf.addPage();

  const placas = Object.keys(resultadosPorPlaca);

  placas.forEach((placa, index) => {
    const d = resultadosPorPlaca[placa][0]; // 🔥 pega dados da placa
    const status = statusPlacas[placa];

    // ===============================
    // 🆕 NOVA PÁGINA (exceto primeira)
    // ===============================
    if (index > 0) {
      adicionarRodape(pdf, pagina++);
      pdf.addPage();
    }

    adicionarCabecalho(pdf, "RELATORIO GERAL DE EXCEDENTE", margem);

    let y = 30;

    // ===============================
    // 🔷 TÍTULO
    // ===============================
    pdf.setTextColor(255);
    pdf.setFontSize(12);
    pdf.text(`PLACA: ${placa}`, margem, y);

    y += 8;

    // ===============================
    // 🎨 CARDS
    // ===============================
    desenharCardsResumo(pdf, d, status, y);

    y += 45;

    // ===============================
    // 📊 GRÁFICO DE BARRAS (TOP 12)
    // ===============================
    const eventosTop = [...d.eventos]
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 12);

    const imgBarra = gerarGraficoPDF(eventosTop);

    if (imgBarra) {
      pdf.addImage(imgBarra, "PNG", margem, y, 180, 60);
      y += 65;
    }

    // ===============================
    // 📈 GRÁFICO DE LINHA
    // ===============================
    const imgLinha = gerarGraficoLinhaPDF(d.eventosTimeline);

    if (imgLinha) {
      pdf.addImage(imgLinha, "PNG", margem, y, 180, 50);
      y += 55;
    }

    // ===============================
    // 🥧 PIZZA + INSIGHTS
    // ===============================
    const eventosPizza = eventosTop.slice(0, 6);
    const imgPizza = gerarGraficoPizzaPDF(eventosPizza);
    const insights = gerarInsights(d);

    // ===============================
    // 🥧 BLOCO PIZZA + INSIGHTS (ALINHADO)
    // ===============================
    const alturaBloco = 90;

    const xPizza = margem;
    const xInfo = margem + 95; // 🔥 sempre relativo à pizza

    const yTopo = y;

    // 🍩 PIZZA
    if (imgPizza) {
      pdf.addImage(imgPizza, "PNG", xPizza, yTopo, 90, alturaBloco);
    }

    // 🔷 INSIGHTS (ALINHADO AO TOPO DA PIZZA)
    let yInfo = yTopo + 30;

    pdf.setTextColor(0, 120, 180);
    pdf.setFontSize(11);
    pdf.text("INSIGHTS", xInfo, yInfo);

    yInfo += 8;

    pdf.setTextColor(40);
    pdf.setFontSize(9);

    // 🔥 quebra automática de texto longo
    const eventoPrincipal = pdf.splitTextToSize(
      `Evento principal: ${insights.principal}`,
      80,
    );

    pdf.text(eventoPrincipal, xInfo, yInfo);
    yInfo += eventoPrincipal.length * 5;

    pdf.text(`% Top: ${insights.percentual}%`, xInfo, yInfo);
    yInfo += 6;

    pdf.text(`Total eventos: ${insights.total}`, xInfo, yInfo);

    // ===============================
    // 🔥 AVANÇA O Y CORRETAMENTE
    // ===============================
    y += alturaBloco + 10;
  });

  adicionarRodape(pdf, pagina);

  pdf.save("relatorio_geral.pdf");
}

function desenharRankingGlobal(pdf, resultadosPorPlaca, statusPlacas) {
  const margem = 10;
  let y = 30;

  // ===============================
  // 🏆 TÍTULO
  // ===============================
  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(14);
  pdf.text("RANKING GLOBAL DE PLACAS", margem, y);

  y += 10;

  // ===============================
  // 📊 MONTA DADOS
  // ===============================
  const ranking = Object.keys(resultadosPorPlaca).map((placa) => {
    const d = resultadosPorPlaca[placa][0];

    const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);

    const principal = eventosOrdenados[0]?.nome || "-";

    return {
      placa,
      total: d.total,
      principal,
      status: statusPlacas[placa],
    };
  });

  // 🔥 ORDENA POR TOTAL (DESC)
  ranking.sort((a, b) => b.total - a.total);

  // 🔥 TOP 12 (ajuste aqui se quiser)
  const topRanking = ranking.slice(0, 12);

  // ===============================
  // 🔷 CABEÇALHO
  // ===============================
  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(10);

  pdf.text("PLACA", margem, y);
  pdf.text("TOTAL", 70, y);
  pdf.text("EVENTO PRINCIPAL", 110, y);
  pdf.text("STATUS", 180, y);

  y += 4;

  pdf.setDrawColor(0, 229, 255);
  pdf.line(margem, y, 200, y);

  y += 6;

  // ===============================
  // 📋 LINHAS
  // ===============================
  topRanking.forEach((item, index) => {
    // zebra
    if (index % 2 === 0) {
      pdf.setFillColor(20, 20, 30);
      pdf.rect(margem, y - 4, 190, 6, "F");
      pdf.setTextColor(255);
    } else {
      pdf.setTextColor(40);
    }

    pdf.setFontSize(9);

    // 🔥 quebra nome do evento se necessário
    const nomeEvento =
      item.principal.length > 22
        ? item.principal.substring(0, 22) + "..."
        : item.principal;

    const statusTexto = item.status === "APTO" ? "APTO" : "NAO APTO";

    pdf.text(`${index + 1}. ${item.placa}`, margem, y);
    pdf.text(String(item.total), 70, y);
    pdf.text(nomeEvento, 110, y);

    // 🔥 cor do status
    if (item.status === "APTO") {
      pdf.setTextColor(0, 200, 0);
    } else {
      pdf.setTextColor(255, 80, 80);
    }

    pdf.text(statusTexto, 180, y);

    y += 6;
  });
}

// ===============================
// 📊 GERAR GRÁFICO PARA PDF (FIXO)
// ===============================
function gerarGraficoPDF(eventos) {
  const canvas = document.createElement("canvas");

  // 🔥 tamanho fixo (controle total)
  canvas.width = 800;
  canvas.height = 300;

  const ctx = canvas.getContext("2d");

  const chartTemp = new Chart(ctx, {
    type: "bar",
    data: {
      labels: eventos.map((e) => formatarLabel(e.nome)),
      datasets: [
        {
          data: eventos.map((e) => e.qtd),
          backgroundColor: "rgba(0,229,255,0.7)",
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,

      plugins: {
        legend: {
          display: false,
          labels: {
            color: "#000", // 🔥 legenda escura
            font: {
              size: 11,
              weight: "bold",
            },
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: "#111", // 🔥 labels eixo X escuros
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            padding: 10, // 🔥 espaçamento entre label e eixo
            font: {
              size: 10,
              weight: "600",
            },
          },
          grid: {
            color: "rgba(0,0,0,0.1)", // leve e elegante
          },
        },

        y: {
          ticks: {
            color: "#000", // 🔥 números eixo Y escuros
            font: {
              size: 10,
              weight: "bold",
            },
          },
          grid: {
            color: "rgba(0,0,0,0.1)",
          },
        },
      },
    },
  });

  const imagem = canvas.toDataURL("image/png", 1.0);

  chartTemp.destroy(); // 🔥 importante

  return imagem;
}

// =========================
// PDF DETALHADO (1 PLACA)
// =========================
function exportarPDFDetalhado() {
  const margem = 10;

  if (!resultadoGraf) return;

  const pdf = new jsPDF();

  let pagina = 1;

  adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);

  const status = statusPlacas[resultadoGraf.placa];

  let y = 30;

  // ===============================
  // 🔷 BLOCO RESUMO
  // ===============================
  pdf.setTextColor(255);
  pdf.setFontSize(12);
  pdf.text(`PLACA: ${resultadoGraf.placa}`, 10, y);

  y += 8;

  // 🔥 NOVO DASHBOARD (CARDS)
  desenharCardsResumo(pdf, resultadoGraf, status, y);

  // ===============================
  // 📏 ESPAÇO REAL DOS CARDS
  // ===============================
  const alturaCard = 20;
  const gapY = 6;
  const espacamentoExtra = 10;

  y += alturaCard * 2 + gapY + espacamentoExtra;

  // ===============================
  // 📊 GRÁFICO (PROPORÇÃO CORRETA)
  // ===============================
  const eventosOrdenadosGraf = [...resultadoGraf.eventos]
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 12);

  const imgGrafico = gerarGraficoPDF(eventosOrdenadosGraf);

  if (imgGrafico) {
    const larguraGrafico = 180;

    // 🔥 proporção original do canvas (800x300)
    const proporcao = 300 / 800;

    const alturaGrafico = larguraGrafico * proporcao;

    // 🔥 VERIFICA ANTES DE DESENHAR
    if (y + alturaGrafico > 270) {
      adicionarRodape(pdf, pagina++);
      pdf.addPage();
      adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);
      y = 30;
    }

    // 🔥 AGORA DESENHA
    pdf.addImage(imgGrafico, "PNG", 10, y, larguraGrafico, alturaGrafico);

    // 🔥 ATUALIZA Y
    y += alturaGrafico + 10;
  }

  const alturaLinha = 60;

  if (y + 15 + alturaLinha > 270) {
    adicionarRodape(pdf, pagina++);
    pdf.addPage();
    adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);
    y = 30;
  }

  // ===============================
  // 📈 ANÁLISE TEMPORAL (LINHA)
  // ===============================
  pdf.setDrawColor(180);
  pdf.line(margem, y, 200, y);
  y += 5;

  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(12);
  pdf.text("ANÁLISE TEMPORAL", margem, y);

  y += 8;

  // 🔥 GRÁFICO DE LINHA
  const imgLinha = gerarGraficoLinhaPDF(resultadoGraf.eventosTimeline);

  if (imgLinha) {
    const alturaLinha = 60;

    pdf.addImage(imgLinha, "PNG", margem, y, 180, alturaLinha);

    y += alturaLinha + 10; // 🔥 controle real
  }

  if (y > 160) {
    adicionarRodape(pdf, pagina++);
    pdf.addPage();
    adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);
    y = 30;
  }

  // ===============================
  // 🥧 DISTRIBUIÇÃO + INSIGHTS
  // ===============================
  pdf.setDrawColor(180);
  pdf.line(margem, y, 200, y);
  y += 5;

  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(12);
  pdf.text("DISTRIBUIÇÃO E INSIGHTS", margem, y);

  y += 8;

  // 🔥 GERA DADOS
  const imgPizza = gerarGraficoPizzaPDF(eventosOrdenadosGraf.slice(0, 8));
  const insights = gerarInsights(resultadoGraf);

  // ===============================
  // 🥧 BLOCO ORGANIZADO (PIZZA + INSIGHTS + TOP)
  // ===============================

  // 🔥 DIMENSÕES PADRÃO
  const xPizza = margem;
  const yTopo = y;

  const larguraPizza = 95;
  const alturaPizza = 95;
  const alturaBlocoPizza = 95;

  const xInfo = 110;
  let yInfo = yTopo;

  // ===============================
  // 🍩 PIZZA (MAIOR E ALINHADA)
  // ===============================
  if (imgPizza) {
    pdf.addImage(imgPizza, "PNG", xPizza, yTopo, larguraPizza, alturaPizza);
  }

  // ===============================
  // 📊 INSIGHTS (TOPO DIREITA)
  // ===============================
  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(11);
  pdf.text("INSIGHTS", xInfo, yInfo);

  yInfo += 6;

  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(9);

  pdf.text(`• Evento principal: ${insights.principal}`, xInfo, yInfo);
  yInfo += 5;

  pdf.text(`• % Top: ${insights.percentual}%`, xInfo, yInfo);
  yInfo += 5;

  pdf.text(`• Total eventos: ${insights.total}`, xInfo, yInfo);
  yInfo += 8;

  // ===============================
  // 🔝 TOP EVENTOS (ALINHADO)
  // ===============================
  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(10);
  pdf.text("TOP EVENTOS", xInfo, yInfo);

  yInfo += 5;

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(8);

  // 🔥 pega top 12
  const topEventos = [...resultadoGraf.eventos]
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 12);

  // 🔥 LISTA ORGANIZADA
  topEventos.forEach((e, i) => {
    const nome = e.nome.length > 22 ? e.nome.substring(0, 22) + "..." : e.nome;

    const linha = `${i + 1}. ${nome} (${e.percentual.toFixed(1)}%)`;

    pdf.text(linha, xInfo, yInfo);

    yInfo += 4;
  });

  // ===============================
  // 🔥 AVANÇO REAL DO BLOCO
  // ===============================
  y += alturaBlocoPizza + 10;

  if (y > 220) {
    adicionarRodape(pdf, pagina++);
    pdf.addPage();
    adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);
    y = 30;
  }

  // ===============================
  // 🔷 CABEÇALHO DA TABELA
  // ===============================
  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(11);

  pdf.text("EVENTO", margem, y);
  pdf.text("QTD", 130, y);
  pdf.text("%", 170, y);

  y += 4;

  pdf.setDrawColor(0, 229, 255);
  pdf.line(margem, y, 200, y);

  y += 6;

  // ===============================
  // 📋 DADOS DA TABELA
  // ===============================
  const eventosOrdenados = [...resultadoGraf.eventos].sort(
    (a, b) => b.qtd - a.qtd,
  );

  eventosOrdenados.forEach((e, index) => {
    // 🔲 Zebra (linhas alternadas)
    if (index % 2 === 0) {
      pdf.setFillColor(20, 20, 30);
      pdf.rect(margem, y - 4, 190, 6, "F");

      pdf.setTextColor(255); // branco
    } else {
      pdf.setTextColor(20); // cinza escuro (melhor que preto puro)
    }

    pdf.setFontSize(10);

    pdf.text(String(e.nome || "-"), margem, y);
    pdf.text(String(e.qtd), 130, y);
    pdf.text(`${e.percentual.toFixed(2)}%`, 170, y);

    y += 6;

    // 🔄 QUEBRA DE PÁGINA
    if (y > 270) {
      adicionarRodape(pdf, pagina++);
      pdf.addPage();
      adicionarCabecalho(pdf, "RELATORIO DE EXCEDENTE", margem);
      y = 30;
    }
  });

  adicionarRodape(pdf, pagina);

  pdf.save(`relatorio_${resultadoGraf.placa}.pdf`);
}

// ===============================
// 🧾 CABEÇALHO PDF
// ===============================
function adicionarCabecalho(pdf, titulo, margem) {
  pdf.setFillColor(5, 1, 13);
  pdf.rect(0, 0, 210, 20, "F");

  pdf.setTextColor(0, 120, 180);
  pdf.setFontSize(14);
  pdf.text(titulo, margem, 12); // ✅ agora funciona

  pdf.setTextColor(150);
  pdf.setFontSize(8);
  pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 150, 12);
}

// ===============================
// 📄 RODAPÉ PDF
// ===============================
function adicionarRodape(pdf, pagina) {
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(`Pagina ${pagina}`, 180, 290);
}

// ===============================
// 📊 CAPTURAR GRÁFICO (Chart.js)
// ===============================
function obterImagemGrafico() {
  const canvas = document.getElementById("grafico");
  if (!canvas) return null;

  return canvas.toDataURL("image/png", 1.0);
}
// ===============================
// 🎨 CARDS RESUMO (LAYOUT CORRIGIDO 3 EM CIMA / 2 EMBAIXO)
// ===============================
function desenharCardsResumo(pdf, d, status, yInicial) {
  // ===============================
  // 📏 CONFIGURAÇÕES DE LAYOUT
  // ===============================
  const larguraCard = 58; // largura base (linha de cima)
  const alturaCard = 20;

  const gapX = 6;
  const gapY = 6;

  const xInicial = 10;

  // ===============================
  // 📐 LARGURA TOTAL DO GRID
  // ===============================
  const larguraTotal = larguraCard * 3 + gapX * 2;

  // 🔥 AGORA DIVIDIMOS EM 2 CARDS IGUAIS
  const larguraCardInferior = (larguraTotal - gapX) / 2;

  // ===============================
  // 🎯 POSIÇÕES
  // ===============================
  const linha1Y = yInicial;
  const linha2Y = yInicial + alturaCard + gapY;

  const col1 = xInicial;
  const col2 = xInicial + larguraCard + gapX;
  const col3 = xInicial + (larguraCard + gapX) * 2;

  // ===============================
  // 🟦 LINHA 1 (3 CARDS)
  // ===============================

  // INTERVALO
  desenharCard(
    pdf,
    col1,
    linha1Y,
    larguraCard,
    alturaCard,
    "INTERVALO",
    d.intervaloTransmissao || "-",
  );

  // TOTAL
  desenharCard(
    pdf,
    col2,
    linha1Y,
    larguraCard,
    alturaCard,
    "TOTAL",
    String(d.total),
  );

  // STATUS
  let statusTexto = "NAO DEFINIDO";
  let corStatus = [150, 150, 150];

  if (status === "APTO") {
    statusTexto = "APTO";
    corStatus = [0, 200, 0];
  } else if (status === "NAO_APTO") {
    statusTexto = "NAO APTO";
    corStatus = [255, 60, 60];
  }

  desenharCard(
    pdf,
    col3,
    linha1Y,
    larguraCard,
    alturaCard,
    "STATUS",
    statusTexto,
    corStatus,
  );

  // ===============================
  // 🟦 LINHA 2 (AGORA 2 CARDS IGUAIS ✅)
  // ===============================

  // 🔥 EVENTO PRINCIPAL
  const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);

  const principal = eventosOrdenados[0]?.nome || "-";
  const percentual = eventosOrdenados[0]?.percentual?.toFixed(2) || "0";

  desenharCardMultilinha(
    pdf,
    col1,
    linha2Y,
    larguraCardInferior,
    alturaCard,
    "EVENTO PRINCIPAL",
    principal,
    `${percentual}%`,
  );

  // 🔥 PERÍODO / ARQUIVO
  const periodo = `${formatarData(d.dataInicio)} até ${formatarData(d.dataFim)}`;

  desenharCardMultilinha(
    pdf,
    col1 + larguraCardInferior + gapX,
    linha2Y,
    larguraCardInferior,
    alturaCard,
    "PERIODO / ARQUIVO",
    periodo,
    d.nomeArquivo || "-",
  );
}
// =======================
// CARD SIMPLES
// =======================
function desenharCard(
  pdf,
  x,
  y,
  w,
  h,
  titulo,
  valor,
  corValor = [255, 255, 255],
) {
  // fundo
  pdf.setFillColor(20, 25, 40);
  pdf.roundedRect(x, y - 4, w, h, 2, 2, "F");

  // título
  pdf.setTextColor(150);
  pdf.setFontSize(7);
  pdf.text(titulo, x + 2, y);

  // valor
  pdf.setTextColor(...corValor);
  pdf.setFontSize(10);
  pdf.text(valor, x + 2, y + 7);
}
// ======================
// CARD MÙLTIPLAS LINHAS
// ======================
function desenharCardMultilinha(pdf, x, y, w, h, titulo, linha1, linha2) {
  // fundo
  pdf.setFillColor(20, 25, 40);
  pdf.roundedRect(x, y - 4, w, h, 2, 2, "F");

  // título
  pdf.setTextColor(150);
  pdf.setFontSize(7);
  pdf.text(titulo, x + 2, y);

  // ===============================
  // 🔥 LINHA 1 (DINÂMICA)
  // ===============================
  pdf.setTextColor(255);
  pdf.setFontSize(8);

  const texto = pdf.splitTextToSize(linha1, w - 4);

  // desenha linha 1
  pdf.text(texto, x + 2, y + 5);

  // ===============================
  // 🔥 CALCULA ALTURA REAL USADA
  // ===============================
  const alturaTexto = texto.length * 4; // ajuste fino

  // ===============================
  // 🔷 LINHA 2 (AZUL - ARQUIVO)
  // ===============================
  if (linha2) {
    pdf.setTextColor(0, 120, 180);

    pdf.text(
      linha2,
      x + 2,
      y + 5 + alturaTexto, // 🔥 posição dinâmica (corrige duplicação)
    );
  }
}

function gerarGraficoLinhaPDF(timeline) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 300;

  const ctx = canvas.getContext("2d");

  const dados = agruparPorData(timeline);

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dados.map((d) => d.data),
      datasets: [
        {
          data: dados.map((d) => d.qtd),
          borderColor: "#0077aa",
          backgroundColor: "rgba(0,119,170,0.25)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false },
      },
    },
  });

  const img = canvas.toDataURL("image/png", 1.0);
  chart.destroy();

  return img;
}

function gerarGraficoPizzaPDF(eventos) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: eventos.map((e) => e.nome),
      datasets: [
        {
          data: eventos.map((e) => e.qtd),
          backgroundColor: eventos.map((_, i) => `hsl(${i * 30}, 70%, 50%)`),
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { position: "right" },
      },
    },
  });

  const img = canvas.toDataURL("image/png", 1.0);
  chart.destroy();

  return img;
}

function gerarInsights(d) {
  const top = [...d.eventos].sort((a, b) => b.qtd - a.qtd)[0];

  return {
    principal: top.nome,
    percentual: top.percentual.toFixed(2),
    total: d.total,
  };
}

function formatarLabel(nome) {
  const palavras = nome.split(" ");
  const linhas = [];

  let linhaAtual = "";

  palavras.forEach((palavra) => {
    // tenta adicionar palavra na linha atual
    const teste = linhaAtual ? linhaAtual + " " + palavra : palavra;

    // 🔥 limite de caracteres por linha (ajuste fino aqui)
    if (teste.length > 12) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = teste;
    }
  });

  // adiciona última linha
  if (linhaAtual) linhas.push(linhaAtual);

  // 🔥 limita em até 4 linhas
  return linhas.slice(0, 4);
}

// ===============================
// 📊 PROGRESSO
// ===============================
function atualizarProgresso(atual, total) {
  document.getElementById("progresso").innerText = `${atual} / ${total}`;
}

// ===============================
// 🚪 LOGOUT
// ===============================
async function logout() {
  try {
    // Chamada API para logout no backend, que invalidará os cookies.
    await apiRequest("/auth/logout", {
      method: "POST",
      credentials: "include", // Essencial para enviar cookies de sessão ao endpoint de logout
    });
    console.log("✅ Logout concluído.");
  } catch (e) {
    console.warn("Erro ao fazer logout no servidor:", e);
    // Mesmo com erro no servidor, o frontend deve limpar seu estado e redirecionar
  }
  // 🔄 Redireciona para a página de login
  window.location.href = "login.html";
}

let usuarioLogado = null;
let intervalUsuarios = null;

// ===============================
// 👤 USUÁRIO LOGADO + DROPDOWN
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const campo = document.getElementById("usuarioLogado");
  const painel = document.getElementById("painelMaster");
  const btnMaster = document.getElementById("btnAbrirMaster");

  if (!campo || !painel) return;

  painel.classList.add("hidden");

  try {
    usuarioLogado = await apiRequest("/auth/me");
    //console.log("Usuário recebido:", usuarioLogado);
    console.log("Perfil:", usuarioLogado.perfil);

    campo.innerHTML = `👤 ${usuarioLogado.nome}
             <span class="status online"></span>`;

    if (usuarioLogado.perfil === "MASTER") {
      btnMaster.classList.remove("hidden");

      campo.addEventListener("click", () => {
        painel.classList.toggle("hidden");
      });

      btnMaster.addEventListener("click", () => {
        window.open("master.html", "_blank", "noopener,noreferrer");
      });

      carregarUsuariosOnline();

      if (!intervalUsuarios) {
        intervalUsuarios = setInterval(carregarUsuariosOnline, 5000);
      }
    }
  } catch (e) {
    console.error(e);
  }
});

// ===================================
// ⏱ MANTER USUÁRIO ATIVO (SEGURO)
// ===================================
setInterval(() => {
  fetchWithAuthRetry(API_BASE + "/usuario/heartbeat", {
    method: "POST",
  });
}, 60000); // a cada 1 min

function atualizarStatusTopo() {
  const el = document.getElementById("statusTopo");
  if (!el) return;

  const status = statusPlacas[placaAtual];

  el.classList.remove("apto", "nao-apto");

  if (!status) {
    el.innerText = "Status: —";
    return;
  }

  if (status === "APTO") {
    el.innerText = "Status: 🟢 Apto a Desconto";
    el.classList.add("apto");
  }

  if (status === "NAO_APTO") {
    el.innerText = "Status: 🔴 Não Apto a Desconto";
  }
}

// ===================================
// 👑 PAINEL MASTER - USUÁRIOS ONLINE
// ===================================
async function carregarUsuariosOnline() {
  const container = document.getElementById("usuariosOnlineMaster");
  // Removido: const usuarioAtual = localStorage.getItem("usuario");
  // O nome do usuário atual deve ser obtido de uma fonte segura em memória ou através de um endpoint.
  // Por enquanto, usaremos um placeholder ou você pode implementar uma forma de obter isso.
  const usuarioAtual = usuarioLogado ? usuarioLogado.nome : null;

  if (!container) return;

  container.innerHTML = "Carregando...";

  try {
    const response = await fetchWithAuthRetry(API_BASE + "/usuario/online", {
      credentials: "include", // Essencial para enviar cookies de autenticação
    });
    const lista = await response.json();

    if (!Array.isArray(lista) || lista.length === 0) {
      container.innerHTML = "Nenhum usuário online";
      return;
    }

    container.innerHTML = "";

    lista.forEach((u) => {
      const statusClass = u.online ? "online" : "offline";

      // 🔥 destaque do usuário atual (se disponível)
      const isMe = usuarioAtual && u.nome === usuarioAtual ? "me" : "";

      container.innerHTML += `
        <div class="usuario-item ${statusClass} ${isMe}">
          <span>👤 ${u.nome}</span>
          <span class="status-dot"></span>
        </div>
      `;
    });
  } catch (e) {
    console.error("Erro ao carregar usuários:", e);
    container.innerHTML = "Erro ao carregar";
  }
}

// ==================
// ANIMAÇÂO CASCADE
// =================
window.addEventListener("load", () => {
  const elementos = document.querySelectorAll(".fade-in");

  elementos.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add("show");
    }, index * 200); // delay progressivo
  });
});

// ===============================
// 🤖 EFEITO IA (DIGITA / APAGA / LOOP)
// 🔥 VERSÃO EVOLUÍDA E ESCALÁVEL
// ===============================

// ===============================
// 📚 FRASES ORGANIZADAS POR ETAPA
// ===============================
const frases = {
  inicio: [
    "Inicializando análise...",
    "Carregando estrutura de dados",
    "Preparando ambiente",
    "Configurando sistema",
  ],
  processamento: [
    "Processando dados...",
    "Lendo arquivo CSV",
    "Normalizando colunas",
    "Validando registros",
    "Filtrando inconsistências",
    "Estruturando informações",
  ],
  analise: [
    "Detectando padrões",
    "Analisando comportamento",
    "Identificando anomalias",
    "Correlacionando dados",
    "Aplicando regras inteligentes",
  ],
  insight: [
    "Gerando insights",
    "Calculando métricas",
    "Extraindo informações relevantes",
    "Montando relatório",
    "Organizando resultados",
  ],
  final: [
    "Análise concluída",
    "Processo finalizado",
    "Dados prontos para visualização",
    "Tudo pronto 🚀",
  ],
};

// ===============================
// 🎯 MAPEAMENTO DE ETAPAS → ESTILO
// ===============================
const etapas = ["inicio", "processamento", "analise", "insight", "final"];

function obterClasse(etapa) {
  if (etapa === "analise" || etapa === "insight") return "typing-warning";
  if (etapa === "final") return "typing-success";
  return "typing-processing";
}

// ===============================
// 🎲 CONTROLE DE FRASES (SEM REPETIÇÃO)
// ===============================
let etapaAtual = 0;
let ultimoTexto = "";

function pegarFrase() {
  const etapa = etapas[etapaAtual];
  const lista = frases[etapa];

  let texto;

  // evita repetir a mesma frase seguida
  do {
    texto = lista[Math.floor(Math.random() * lista.length)];
  } while (texto === ultimoTexto);

  ultimoTexto = texto;

  return {
    texto,
    classe: obterClasse(etapa),
  };
}

// ===============================
// ⚙️ CONTROLE DE DIGITAÇÃO
// ===============================
const elemento = document.getElementById("typing-text");

let charIndex = 0;
let apagando = false;
let atual = pegarFrase();

// ===============================
// 🔄 LOOP PRINCIPAL
// ===============================
function loopDigitacao() {
  // aplica estilo da etapa
  elemento.classList.remove(
    "typing-processing",
    "typing-warning",
    "typing-success",
  );
  elemento.classList.add(atual.classe);

  if (!apagando) {
    // DIGITANDO
    elemento.textContent = atual.texto.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === atual.texto.length) {
      apagando = true;

      // ⏸ pausa maior quando termina frase
      setTimeout(loopDigitacao, 1200);
      return;
    }
  } else {
    // APAGANDO
    elemento.textContent = atual.texto.substring(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      apagando = false;

      // 🔄 avança etapa gradualmente
      etapaAtual = (etapaAtual + 1) % etapas.length;

      // 🎯 pega nova frase
      atual = pegarFrase();
    }
  }

  // ⚡ velocidade dinâmica
  const velocidade = apagando ? 30 : 55;

  setTimeout(loopDigitacao, velocidade);
}

// ===============================
// 🚀 INICIALIZAÇÃO
// ===============================
window.addEventListener("load", () => {
  elemento.classList.add("typing-active");

  // pequena garantia de render
  setTimeout(loopDigitacao, 100);
});
