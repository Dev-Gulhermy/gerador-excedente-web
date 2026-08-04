# Backend - Gerador Excedente Web

## 📁 Estrutura
- auth/ - JWT authentication
- excedente/ - CSV processing  
- master/ - Admin panel
- security/ - Spring Security

## 🔐 Autenticação
- JWT (HS256)
- Refresh tokens com rotation
- Rate limiting por endpoint
- Token version (logout seguro)

## 📊 Processamento de CSV
- Validação de estrutura e tipos
- Parser com Univocity
- Processamento de eventos
- Exportação (PDF, Excel, JSON)

## 🗄️ Banco de Dados
- PostgreSQL schema completo
- Índices otimizados
- Migrations versionadas

## 🔒 Segurança
- Spring Security config
- CORS whitelist
- Rate limiting avançado
- Auditoria completa (quem, quando, por quê)

## 🚀 API Endpoints
- Documentação completa com exemplos