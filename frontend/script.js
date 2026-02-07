let resultado = null;
let chart;

function enviar() {
  const input = document.getElementById("csvFile");

  if (!input.files.length) {
    alert("Selecione um arquivo CSV");
    return;
  }

  const teleevento = document.getElementById("filtroTeleevento").value;
  const comunicacao = document.getElementById("filtroComunicacao").value;

  const formData = new FormData();
  formData.append("file", input.files[0]);   // ✅ corrigido
  formData.append("teleevento", teleevento);
  formData.append("comunicacao", comunicacao);

  fetch("http://localhost:8080/api/excedente/processar", {
    method: "POST",
    body: formData
  })
    .then(async response => {
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      return JSON.parse(text);
    })
    .then(data => {
      resultado = data;
      renderizar(data);
    })
    .catch(err => {
      console.error("Erro:", err.message);
      alert(err.message);
    });
}

function renderizar(d) {
  if (!d || !d.eventos || !Array.isArray(d.eventos)) {
    console.error("Resposta inválida:", d);
    return;
  }

  document.getElementById("placa").innerText = d.placa ?? "-";
  document.getElementById("total").innerText = d.total ?? "-";

  const principal = d.eventos.reduce((a, b) => a.qtd > b.qtd ? a : b);
  document.getElementById("principal").innerText = principal.nome;

  const tbody = document.getElementById("tabelaDados");
  tbody.innerHTML = "";

  const labels = [];
  const valores = [];

  d.eventos.forEach(e => {
    labels.push(e.nome);
    valores.push(e.qtd);

    tbody.innerHTML += `
      <tr>
        <td>${e.nome}</td>
        <td>${e.qtd}</td>
        <td>${e.percentual.toFixed(2)}%</td>
      </tr>
    `;
  });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("grafico"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ data: valores }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });
}


function exportarExcel() {
  const dados = [["Evento", "Qtd", "%"]];
  resultado.eventos.forEach(e => dados.push([e.nome, e.qtd, e.percentual]));
  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Excedente");
  XLSX.writeFile(wb, "excedente.xlsx");
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text(`Placa: ${resultado.placa}`, 10, 15);
  let y = 30;
  resultado.eventos.forEach(e => {
    pdf.text(`${e.nome} - ${e.qtd} (${e.percentual.toFixed(2)}%)`, 10, y);
    y += 8;
  });
  pdf.save("excedente.pdf");
}
