// ===============================
// VARIÁVEIS GLOBAIS
// ===============================

// 🔥 Arquivo original por ID do resultado (placa + período + arquivo)
let arquivosPorResultado = {};

// 🔥 Resultados agrupados por PLACA
// Estrutura:
// {
//   PLACA: [ resultado1, resultado2, ... ]
// }
let resultadosPorPlaca = {};

// Placa atualmente selecionada
let placaAtual = null;

// Índice do resultado (CSV / período) selecionado
let resultadoAtualIndex = 0;

// Resultado atualmente exibido (para gráfico/exportação)
let resultadoGraf = null;

// Instância do Chart.js
let chartGraf = null;

// Evento selecionado no gráfico/tabela
let eventoSelecionado = null;

// ===============================  
// RESULTADO ORIGINAL DO BACKEND 
// =============================== 
let resultadoBackend = null;


// ===============================
// UPLOAD / ENVIO DOS CSVs
// ===============================
function enviar() {
  const input = document.getElementById("csvFile");

  if (!input.files.length) {
    alert("Selecione ao menos um CSV");
    return;
  }

  const comunicacao = document.getElementById("filtroComunicacao").value;

  [...input.files].forEach(file => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("comunicacao", comunicacao);

    // ===============================
    // CONFIGURAÇÃO DA API (BACKEND)
    // ===============================
    // 🔥 FORÇADO PARA BACKEND LOCAL
    // Evita chamar Render acidentalmente
    // const API_URL = "http://localhost:8080";

    const API_URL =
      location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://gerador-excedente-web.onrender.com";

    fetch(`${API_URL}/api/excedente/processar`, {
      method: "POST",
      body: formData
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensagem || "Erro ao processar CSV");
        return data;
      })
      .then(data => {

        // ===============================
        // AGRUPAMENTO CORRETO POR PLACA
        // ===============================
        if (!resultadosPorPlaca[data.placa]) {
          resultadosPorPlaca[data.placa] = [];
        }

        // 🔥 ID único do resultado (não sobrescreve)
        data._id = `${data.placa}_${data.nomeArquivo}_${data.dataInicio}_${data.dataFim}`;

        resultadosPorPlaca[data.placa].push(data);

        // Guarda o arquivo original vinculado a esse resultado
        arquivosPorResultado[data._id] = file;

        atualizarSelectPlacas();

        // Primeira placa enviada vira a ativa
        if (!placaAtual) {
          placaAtual = data.placa;
          document.getElementById("filtroPlaca").value = placaAtual;
          carregarPeriodos();
        }
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
      });
  });
}


// ===============================
// EXIBE NOMES DOS CSVs SELECIONADOS
// ===============================
document.getElementById("csvFile").addEventListener("change", function () {
  document.getElementById("nomeArquivos").innerText =
    [...this.files].map(f => f.name).join(", ");
});


// ===============================
// SELECT DE PLACAS
// ===============================
function atualizarSelectPlacas() {
  const select = document.getElementById("filtroPlaca");
  select.innerHTML = `<option value="">Selecione a placa</option>`;

  Object.keys(resultadosPorPlaca).forEach(placa => {
    select.innerHTML += `<option value="${placa}">${placa}</option>`;
  });
}

// ================================
// REPROCESSA O RESULTADO ATUAL
// (PLACA + PERÍODO + CSV)
// ================================
function reprocessarPlacaAtual() {

  if (!placaAtual) return;

  const comunicacao =
    document.getElementById("filtroComunicacao").value;

  // 🔥 Resultado atualmente selecionado
  const resultadoAtual =
    resultadosPorPlaca[placaAtual][resultadoAtualIndex];

  if (!resultadoAtual) {
    console.warn("Resultado atual não encontrado");
    return;
  }

  // 🔥 Recupera o arquivo correto pelo _id
  const file = arquivosPorResultado[resultadoAtual._id];

  if (!file) {
    console.warn("Arquivo não encontrado para o resultado:", resultadoAtual._id);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("comunicacao", comunicacao);

  // ===============================
  // CONFIGURAÇÃO DA API (BACKEND)
  // ===============================
  // 🔥 FORÇADO PARA BACKEND LOCAL
  // Evita chamar Render acidentalmente
  // const API_URL = "http://localhost:8080";

  const API_URL =
    location.hostname === "localhost"
      ? "http://localhost:8080"
      : "https://gerador-excedente-web.onrender.com";

  fetch(`${API_URL}/api/excedente/processar`, {
    method: "POST",
    body: formData
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.mensagem || "Erro ao reprocessar CSV");
      }
      return data;
    })
    .then(data => {

      // 🔥 MANTÉM O MESMO _id (substitui apenas os dados)
      data._id = resultadoAtual._id;

      resultadosPorPlaca[placaAtual][resultadoAtualIndex] = data;

      renderizar(data);
    })
    .catch(err => {
      console.error("Erro ao reprocessar:", err);
      alert(err.message);
    });
}


// ===============================
// AO TROCAR PLACA → CARREGA PERÍODOS
// ===============================
function trocarPlaca() {
  placaAtual = document.getElementById("filtroPlaca").value;
  if (!placaAtual) return;

  carregarPeriodos();
}


// ===============================
// SELECT DE PERÍODOS / CSVs
// ===============================
function carregarPeriodos() {
  const selectPeriodo = document.getElementById("filtroPeriodo");
  selectPeriodo.innerHTML = `<option value="">Selecione o período</option>`;

  resultadosPorPlaca[placaAtual].forEach((r, index) => {
    selectPeriodo.innerHTML += `
      <option value="${index}">
        ${formatarData(r.dataInicio)} até ${formatarData(r.dataFim)} (${r.nomeArquivo})
      </option>
    `;
  });

  resultadoAtualIndex = 0;
  renderizar(resultadosPorPlaca[placaAtual][0]);
}

function trocarPeriodo() {
  const index = document.getElementById("filtroPeriodo").value;
  if (index === "") return;

  resultadoAtualIndex = index;
  eventoSelecionado = null;
  renderizar(resultadosPorPlaca[placaAtual][index]);
}


// ===============================
// RENDERIZAÇÃO (CARDS / TABELA / GRÁFICO)
// ===============================
function renderizar(d) {
  if (!d || !Array.isArray(d.eventos)) return;

  resultadoGraf = d;

  // ===============================
  // CARDS PRINCIPAIS
  // ===============================
  document.getElementById("placa").innerText = d.placa;
  document.getElementById("total").innerText = d.total;

  const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);
  document.getElementById("principal").innerText =
    eventosOrdenados[0]?.nome ?? "-";

  // ===============================
  // CARD PERÍODO / ARQUIVO
  // ===============================
  document.getElementById("periodo").innerText =
    `${formatarData(d.dataInicio)} até ${formatarData(d.dataFim)}`;

  document.getElementById("arquivo").innerText =
    d.nomeArquivo ?? "-";

  // ===============================
  // TABELA
  // ===============================
  const tbody = document.getElementById("tabelaDados");
  tbody.innerHTML = "";

  eventosOrdenados.forEach(e => {
    const ativo = e.nome === eventoSelecionado;
    tbody.innerHTML += `
      <tr class="${ativo ? "linha-ativa" : ""}"
          onclick="filtrarEventoGraf('${e.nome.replace(/'/g, "\\'")}')">
        <td>${e.nome}</td>
        <td>${e.qtd}</td>
        <td>${e.percentual.toFixed(2)}%</td>
      </tr>
    `;
  });

  // ===============================
  // GRÁFICO
  // ===============================
  const LIMITE_GRAFICO = 15;

  const eventosGraf = (eventoSelecionado
    ? eventosOrdenados.filter(e => e.nome === eventoSelecionado)
    : eventosOrdenados
  ).slice(0, LIMITE_GRAFICO);

  const labels = eventosGraf.map(e => e.nome);
  const valores = eventosGraf.map(e => e.qtd);

  const canvas = document.getElementById("grafico");
  const wrapper = document.getElementById("graficoWrapper");

  if (chartGraf) chartGraf.destroy();

  if (!valores.length) {
    wrapper.classList.remove("ativo");
    return;
  }

  wrapper.classList.add("ativo");

  chartGraf = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ data: valores }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: eventoSelecionado
            ? `Evento: ${eventoSelecionado}`
            : `Top ${LIMITE_GRAFICO} Eventos`
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


// ===============================
// FILTRO POR EVENTO
// ===============================
function filtrarEventoGraf(nome) {
  eventoSelecionado = eventoSelecionado === nome ? null : nome;
  renderizar(resultadoGraf);
}


// ===============================
// EXPORTAÇÕES
// ===============================
function exportarExcel() {
  if (!resultadoGraf) return;

  const dados = [["Evento", "Qtd", "%"]];
  resultadoGraf.eventos.forEach(e =>
    dados.push([e.nome, e.qtd, e.percentual])
  );

  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Excedente");

  XLSX.writeFile(
    wb,
    `excedente_${resultadoGraf.placa}_${resultadoGraf.dataInicio}_${resultadoGraf.dataFim}.xlsx`
  );
}

function exportarPDF() {
  if (!resultadoGraf) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text(`Placa: ${resultadoGraf.placa}`, 10, 15);
  pdf.text(`Período: ${formatarData(resultadoGraf.dataInicio)} até ${formatarData(resultadoGraf.dataFim)}`, 10, 22);

  let y = 35;
  resultadoGraf.eventos.forEach(e => {
    pdf.text(`${e.nome} - ${e.qtd} (${e.percentual.toFixed(2)}%)`, 10, y);
    y += 8;
  });

  pdf.save(`excedente_${resultadoGraf.placa}.pdf`);
}


// ===============================
// FUNÇÃO AUXILIAR – FORMATA DATA
// (BACKEND JÁ ENVIA NO FORMATO CORRETO)
// ===============================
function formatarData(data) {
  if (!data || data === "N/A" || data === "undefined") {
    return "-";
  }

  // 🔥 Data já vem no formato:
  // dd/MM/yyyy HH:mm
  return data;
}

// ===============================
// EVENTO DE FILTRO DE COMUNICAÇÃO
// ===============================
document
  .getElementById("filtroComunicacao")
  .addEventListener("change", () => {
    if (placaAtual) {
      reprocessarPlacaAtual();
    }
  });