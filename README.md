# 📊 Gerador de Excedente Web

Aplicação web para **processamento, análise e visualização de excedentes de teleeventos a partir de arquivos CSV**, com backend em **Spring Boot** e frontend em **HTML, CSS e JavaScript**.

O sistema permite enviar múltiplos CSVs, agrupar dados por **placa**, gerar **gráficos dinâmicos**, **tabelas detalhadas** e exportar os resultados em **Excel** e **PDF**.

---

## 🚀 Visão Geral

Este projeto foi desenvolvido com foco em:

  🔎 Análise de grandes volumes de dados
  
  📊 Visualização clara e estratégica de informações
  
  🔗 Integração completa entre frontend e backend (API REST)
  
  📡 Validação técnica de excedente satelital
  
Ele resolve um problema comum em ambientes de monitoramento e telecomunicações:  

  ➡️ **identificar, organizar e analisar eventos excedentes de forma rápida e visual**.

---

## 🎯 Objetivo do Projeto

- Processar arquivos CSV com milhares de registros
- Consolidar e agrupar eventos por placa
- Permitir análise por tipo de comunicação
- Filtrar dados por período
- Lidar com múltiplos CSVs da mesma placa com datas distintas
- Exibir os dados de forma clara, interativa e estratégica
- Evitar sobrecarga visual em gráficos com muitos dados
- Demonstrar integração real entre frontend e backend
- Simular um cenário profissional de análise e validação de cobranças

---

## 🖥️ Funcionalidades

📂 Processamento de Arquivos
- Upload de **múltiplos arquivos CSV**
- Processamento backend com **Spring Boot**
- Consolidação automática de dados
- Tratamento de arquivos com:
  - Mesma placa
  - Datas diferentes
  - Grandes volumes de registros
- Agrupamento de dados por **placa**
- Filtro dinâmico por placa
- **Tabela completa** com todos os eventos
- **Gráfico de barras (Top N eventos)** com limitação inteligente
- Destaque de evento ao clicar na tabela
- Exportação para:

  - 📄 **PDF**
  
  - 📊 **Excel (.xlsx)**
  
- Interface responsiva com **tema dark neon**
- Proteção contra quebra de layout com grandes volumes de dados

---

🔎 Filtros Inteligentes

Após o processamento, é possível filtrar os dados por:
🚗 Placa
📡 Tipo de Comunicação
  - Satélite
  - GPRS
  - Em memória
📅 Período (data inicial e final)
  💡 Mesmo que existam múltiplos CSVs com a mesma placa em datas diferentes, o sistema consolida corretamente e permite análise segmentada por período.

---

📊 Visualização de Dados

📌 Cards de resumo
📋 Tabela completa com todos os eventos
📈 Gráfico de barras (Top 15 eventos) com limitação inteligente
- Destaque de evento ao clicar na tabela
- Filtro dinâmico refletido automaticamente no gráfico
- Proteção contra quebra de layout com grandes volumes de dados
- Interface responsiva com tema dark neon

---

## 🧠 Conceitos Aplicados

- Integração Frontend ↔ Backend via API REST
- Upload de arquivos com MultipartFile
- Manipulação e agregação de dados no backend
- Consolidação de múltiplos arquivos simultâneos
- Filtros dinâmicos com atualização de estado no frontend
- Renderização dinâmica via manipulação do DOM
- Visualização de dados com Chart.js
- Boas práticas de UX para gráficos extensos
- Estruturação modular de projeto
- Simulação de cenário real de validação técnica

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (layout responsivo + efeitos visuais)
- JavaScript (Vanilla JS)
- Chart.js
- jsPDF
- SheetJS (XLSX)

### Backend
- Java 17+
- Spring Boot
- Spring Web
- Upload de arquivos multipart
- Docker
- API REST
- Deploy em nuvem (Render)

---

## 🧩 Estrutura do Projeto

```
📁 frontend
 ├── index.html
 ├── style.css
 ├── script.js
 └── assets/
      └── libs/

📁 backend
 ├── src/
 │   ├── controller
 │   ├── service
 │   └── model
 ├── Dockerfile
 ├── pom.xml
 └── application.properties
```

▶️ Executando o Projeto Localmente

🔹 Backend (Spring Boot)

1. Abra o projeto backend na IDE (IntelliJ, Eclipse, VS Code)
2. Configure o limite de upload (se necessário):

spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

3. Execute a aplicação Spring Boot
4. Backend disponível em:
 - http://localhost:8080

---

🔹 Frontend

1. Abra a pasta frontend
2. Execute o arquivo index.html no navegador
3. Envie um ou mais arquivos CSV
4. Visualize os resultados na interface

---

🌐 Deploy em Produção

Backend
- Hospedado no Render
- Executando via Docker
- URL base da API:
  - https://gerador-excedente-web.onrender.com

Frontend
- Pode ser hospedado em:
   - GitHub Pages 
   - Netlify 
   - Vercel
- O frontend consome diretamente a API publicada no Render


---

📊 Lógica de Visualização

- O gráfico exibe apenas os Top 15 eventos, evitando poluição visual
- A tabela mantém 100% dos dados processados
- Ao clicar em um evento na tabela:
  - O gráfico é filtrado automaticamente
  - A linha recebe destaque visual
- Os filtros de placa, comunicação e período recalculam os dados dinamicamente

---

📦 Exportações

📊 Excel (.xlsx)
Exporta todos os eventos conforme os filtros aplicados.

📄 PDF
Gera relatório consolidado com os dados analisados.

---

📌 Status do Projeto

✅ Funcional
🚀 Em produção
🔧 Em constante evolução

Possíveis expansões futuras:
- Autenticação de usuários
- Persistência em banco de dados
- Histórico de análises
- Monitoramento e métricas
- CI/CD automatizado
- Dashboard administrativo
- Versionamento de relatórios

---

👤 Autor

Adeildo Guilhermy Alves da Silva
</ Desenvolvedor Full Stack >

Projeto desenvolvido para análise de excedentes satelitais, onde um veículo, ao ultrapassar determinados limites de consumo de dados (3000, 6000, 8000 bytes, etc.), gera cobranças adicionais durante a comunicação via satélite.

A validação ocorre com base nos principais eventos gerados durante essa comunicação, permitindo identificar se a cobrança do excedente é válida ou não.

O objetivo principal foi otimizar o processo de verificação, eliminando análises manuais extensas, por meio do upload e processamento de múltiplos arquivos CSV, apresentando os resultados de forma clara, visual e confiável.

Além do uso prático, o projeto também foi desenvolvido com foco em estudo, portfólio e demonstração técnica profissional.
