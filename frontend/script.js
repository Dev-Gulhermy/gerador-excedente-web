// ===============================
// VARIÁVEIS GLOBAIS
// ===============================

// Armazena os resultados agrupados por placa
let resultadosPorPlaca = {};

// Placa atualmente selecionada
let placaAtual = null;

// Resultado atualmente exibido (para gráfico/exportação)
let resultadoGraf = null;

// Instância do Chart.js
let chartGraf = null;

// Evento selecionado no gráfico/tabela
let eventoSelecionado = null;

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

  // Envia cada CSV separadamente
  [...input.files].forEach(file => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("comunicacao", comunicacao);

    fetch("http://localhost:8080/api/excedente/processar", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        // Salva resultado por placa
        resultadosPorPlaca[data.placa] = data;

        atualizarSelectPlacas();

        // Primeira placa carregada vira padrão
        if (!placaAtual) {
          placaAtual = data.placa;
          document.getElementById("filtroPlaca").value = placaAtual;
          renderizar(data);
        }
      })
      .catch(err => {
        console.error("Erro:", err);
        alert("Erro ao processar CSV");
      });
  });
}

// Exibe nomes dos arquivos selecionados
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

function trocarPlaca() {
  const select = document.getElementById("filtroPlaca");
  placaAtual = select.value;

  if (!placaAtual) return;

  eventoSelecionado = null;
  renderizar(resultadosPorPlaca[placaAtual]);
}

// ===============================
// RENDERIZAÇÃO (CARDS / TABELA / GRÁFICO)
// ===============================
function renderizar(d) {
  if (!d || !Array.isArray(d.eventos)) return;

  resultadoGraf = d;

  // ===============================
  // CARDS
  // ===============================
  document.getElementById("placa").innerText = d.placa;
  document.getElementById("total").innerText = d.total;

  // Ordena eventos por quantidade (desc)
  const eventosOrdenados = [...d.eventos].sort((a, b) => b.qtd - a.qtd);

  document.getElementById("principal").innerText =
    eventosOrdenados[0]?.nome ?? "-";

  // ===============================
  // TABELA (SEM LIMITE)
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
  // GRÁFICO (TOP N)
  // ===============================
  const LIMITE_GRAFICO = 15; // 🔥 TOP 15 eventos no gráfico

  const eventosParaGrafico = (eventoSelecionado
    ? eventosOrdenados.filter(e => e.nome === eventoSelecionado)
    : eventosOrdenados
  ).slice(0, LIMITE_GRAFICO);

  const labels = eventosParaGrafico.map(e => e.nome);
  const valores = eventosParaGrafico.map(e => e.qtd);

  const canvas = document.getElementById("grafico");

  const wrapper = document.getElementById("graficoWrapper");

  // Destroi gráfico anterior
  if (chartGraf) chartGraf.destroy();

  // 🔥 CONTROLE DO ESPAÇO DO GRÁFICO
  if (!valores.length) {
    wrapper.classList.remove("ativo");
    canvas.classList.remove("ativo");
    return;
  }

  // Exibe wrapper + canvas apenas quando necessário
  wrapper.classList.add("ativo");

  canvas.style.display = "block";
  canvas.offsetHeight; // força reflow
  canvas.classList.add("ativo");

  chartGraf = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: valores
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 500,
        easing: "easeOutQuart"
      },

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
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10, // 🔥 evita explosão do eixo X
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ===============================
// FILTRO POR EVENTO (CLICK NA TABELA)
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

  XLSX.writeFile(wb, `excedente_${resultadoGraf.placa}.xlsx`);
}

function exportarPDF() {
  if (!resultadoGraf) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text(`Placa: ${resultadoGraf.placa}`, 10, 15);

  let y = 30;
  resultadoGraf.eventos.forEach(e => {
    pdf.text(`${e.nome} - ${e.qtd} (${e.percentual.toFixed(2)}%)`, 10, y);
    y += 8;
  });

  pdf.save(`excedente_${resultadoGraf.placa}.pdf`);
}

