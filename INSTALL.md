# InvestHub - Guia de Instalação e Restauração de Dados

Este repositório contém a aplicação **InvestHub** completa (Frontend + Backend), incluindo o histórico de dados e configurações pré-definidos para restauração imediata.

---

## 📋 Pré-requisitos
Certifique-se de ter instalado na sua máquina:
1. **Node.js** (versão 18 ou superior)
2. **Docker Desktop** (com Docker Compose ativo)

---

## 🚀 Passo a Passo para Instalação e Execução

### 1. Clonar e Acessar o Repositório
No terminal da nova máquina, clone o repositório e acesse a pasta raiz do projeto:
```bash
git clone <url-do-repositorio>
cd investhub
```

### 2. Configurar o Banco de Dados (PostgreSQL via Docker)
O banco de dados PostgreSQL roda em um container Docker configurado no diretório `backend`.

1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Inicialize o container do banco de dados em segundo plano:
   ```bash
   docker compose up -d
   ```
   *Isso subirá um banco de dados PostgreSQL exposto na porta `5432` com credenciais padrão configuradas no `.env`.*

### 3. Instalar Dependências e Restaurar os Dados
Com o banco rodando, siga estes comandos dentro da pasta `backend`:

1. Instale as dependências do servidor:
   ```bash
   npm install
   ```
2. Crie as tabelas no banco de dados com o Prisma:
   ```bash
   npx prisma db push
   ```
3. Restaure todos os dados (Usuário, Ativos, Histórico Diário com Snapshots e Metas de Rebalanceamento) a partir do backup compilado em `prisma/seed_backup.json`:
   ```bash
   npm run seed
   ```
   *O script lerá automaticamente o backup e recriará a base de dados exatamente com o mesmo estado, senhas (criptografadas) e dados da máquina original.*

### 4. Rodar o Servidor (Backend)
Ainda dentro da pasta `backend`, inicie o servidor de desenvolvimento:
```bash
npm run dev
```
*O servidor estará ativo em `http://localhost:3001`.*

### 5. Instalar Dependências e Rodar a Interface (Frontend)
Abra um novo terminal na **pasta raiz** do projeto (`investhub`):

1. Instale as dependências do frontend:
   ```bash
   npm install
   ```
2. Inicie a interface de desenvolvimento:
   ```bash
   npm run dev
   ```
*O Vite iniciará o frontend. Abra a URL informada (ex: `http://localhost:5173`) no navegador.*

---

## 🔒 Dados de Acesso Restaurados
Use as seguintes credenciais padrão criadas/restauradas no banco de dados para realizar o login:
*   **E-mail**: `testuser@example.com`
*   **Senha**: `password123`

---

## 🔍 Funcionalidades Chave Implementadas
Para fins de verificação do resultado final das tarefas:

1.  **Exportação do Histórico Completo**:
    *   No dashboard principal, na tabela "Meus Ativos", existem dois botões: **Exportar CSV** (dados em tempo real) e **Exportar Histórico** (série histórica completa contendo as fotos diárias detalhadas dos ativos).
2.  **Foto Diária Automatizada**:
    *   A cada dia (ou via rotina de atualização de preços), o sistema cria um registro em `PortfolioHistory` e grava de forma atômica o estado individual de cada ativo investido na tabela `AssetSnapshot`.
3.  **Tabela de Desvios de Alocação**:
    *   Localizada na aba **Planejamento / Simulação** abaixo do card *Definição de Alvos & Estrutura*.
    *   Ela calcula em tempo real o desvio físico vs. metas configuradas na simulação.
    *   **Filtro Inteligente**: Itens com a coluna **Atual** igual a `0%` (como ativos em *Exterior* / *SP500* que não possuem saldo investido) são automaticamente filtrados e ocultados da visualização.
