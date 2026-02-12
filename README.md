# 📊 Gerador de Excedente Web

Aplicação web para **processamento, análise e visualização de excedentes de teleeventos a partir de arquivos CSV**, com backend em **Spring Boot** e frontend em **HTML, CSS e JavaScript**.

O sistema permite enviar múltiplos CSVs, agrupar dados por **placa**, gerar **gráficos dinâmicos**, **tabelas detalhadas** e exportar os resultados em **Excel** e **PDF**.

---

## 🚀 Visão Geral

Este projeto foi desenvolvido com foco em **análise de grandes volumes de dados**, visualização clara de informações e integração completa entre **frontend e backend**.

Ele resolve um problema comum em ambientes de monitoramento e telecomunicações:  
➡️ **identificar, organizar e analisar eventos excedentes de forma rápida e visual**.

---

## 🎯 Objetivo do Projeto

- Processar arquivos CSV com milhares de registros  
- Agrupar e consolidar eventos por placa  
- Exibir os dados de forma clara e interativa  
- Evitar sobrecarga visual em gráficos com muitos dados  
- Demonstrar integração real entre frontend e backend  
- Simular um cenário profissional de análise e validação de cobranças

---

## 🖥️ Funcionalidades

- Upload de **múltiplos arquivos CSV**
- Processamento backend com **Spring Boot**
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

## 🧠 Conceitos Aplicados

- Integração Frontend ↔ Backend (REST API)
- Upload de arquivos com `MultipartFile`
- Tratamento de grandes volumes de dados
- Manipulação e agregação de dados no backend
- Renderização dinâmica no frontend
- Visualização de dados com **Chart.js**
- Boas práticas de UX para gráficos extensos
- Controle de estado no JavaScript puro
- Simular um cenário profissional de análise e validação de cobranças

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
- API REST
- Deploy em nuvem com Docker

---

## 🧩 Estrutura do Projeto

```
📁 frontend
 ├── index.html
 ├── style.css
 └── script.js

📁 backend
 ├── src
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

📊 Visualização de Dados

- O gráfico exibe apenas os Top 15 eventos, evitando quebra de layout
- A tabela mantém 100% dos dados
- Ao clicar em um evento da tabela:
  - O gráfico é filtrado automaticamente
  - A linha fica destacada

---

📦 Exportações

- Excel: Exporta todos os eventos processados
- PDF: Gera relatório simples com os dados consolidados

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

---

👤 Autor

Adeildo Guilhermy Alves da Silva
</ Desenvolvedor Full Stack >

Projeto desenvolvido para análise de excedentes satelitais, onde um veículo, ao ultrapassar determinados limites de consumo de dados (3000, 6000, 8000 bytes, etc.), gera cobranças adicionais durante a comunicação via satélite.

A validação ocorre com base nos principais eventos gerados durante essa comunicação, permitindo identificar se a cobrança do excedente é válida ou não.

O objetivo principal foi otimizar o processo de verificação, eliminando análises manuais extensas, por meio do upload e processamento de múltiplos arquivos CSV, apresentando os resultados de forma clara, visual e confiável.

Além do uso prático, o projeto também foi desenvolvido com foco em estudo, portfólio e demonstração técnica profissional.
