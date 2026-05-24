<div align="center">
  <img width="1200" height="475" alt="InvestHub Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🚀 InvestHub (AssetFlow Intelligence)
  
  **A plataforma inteligente de gestão de patrimônio, controle de ativos e rebalanceamento dinâmico.**
  
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org)
  [![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vite.dev)
  [![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://prisma.io)
  [![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg)](https://www.docker.com)
</div>

---

## 📋 Sobre o Projeto

O **InvestHub** (AssetFlow Intelligence) é uma solução moderna e robusta para investidores organizarem seu portfólio de investimentos. O sistema calcula a distribuição de ativos por categorias (Ações, FIIs, Cripto, Exterior, etc.), monitora variações de mercado em tempo real e fornece recomendações matemáticas ideais de **rebalanceamento de carteira** baseadas nas metas estipuladas pelo próprio usuário.

O projeto é dividido em duas partes principais:
1. **Frontend (Root):** Aplicação Single Page em React, TypeScript e Vite, com gráficos dinâmicos de alta performance (Recharts), tabelas interativas e suporte a consultas diretas ao modelo Gemini da Google AI.
2. **Backend (`/backend`):** API RESTful desenvolvida em Node.js com Express e TypeScript, utilizando o Prisma ORM para acesso seguro ao banco de dados relacional PostgreSQL.

---

## 🛠️ Tecnologias Principais

### Frontend (Raiz do Projeto)
*   **React 19 & TypeScript**: Interface de usuário moderna e fortemente tipada.
*   **Vite**: Build system ultra-rápido para desenvolvimento.
*   **Recharts**: Visualização gráfica interativa da evolução patrimonial e alocação.
*   **TailwindCSS**: Estilização responsiva e elegante com temas escuros premium.
*   **Google Gemini SDK (`@google/genai`)**: Integração com inteligência artificial para análises preditivas.

### Backend (Pasta `/backend`)
*   **Node.js & Express**: Servidor web rápido para a API REST.
*   **TypeScript**: Código de backend seguro e de fácil manutenção.
*   **Prisma ORM**: Modelagem de dados intuitiva e migrações estruturadas.
*   **PostgreSQL**: Banco de dados relacional extremamente estável e robusto.
*   **Docker & Docker Compose**: Orquestração simplificada do banco de dados local.
*   **Yahoo Finance Fallback Integration**: Atualização em lote e buscas inteligentes de cotações nacionais (B3) e internacionais.

---

## 🚀 Como Configurar e Rodar o InvestHub

Siga este passo a passo detalhado para instalar o ambiente e rodar o InvestHub no seu ou em qualquer outro computador do zero.

### 📋 Pré-requisitos
Antes de começar, certifique-se de ter instalado em seu computador:
1.  **[Git](https://git-scm.com/)**: Para clonar o repositório.
2.  **[Node.js](https://nodejs.org/)** (Versão 18 ou superior): O ambiente de execução JavaScript.
3.  **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Para subir o banco de dados PostgreSQL instantaneamente (fortemente recomendado).

---

### 1️⃣ Passo 1: Clonar o Repositório
Abra o seu terminal (PowerShell, CMD ou terminal do Linux/macOS) e execute:
```bash
git clone https://github.com/thayvarela/investhub.git
cd investhub
```

---

### 2️⃣ Passo 2: Configurar e Iniciar o Backend
A API do backend gerencia o login de usuários, as cotações, os ativos cadastrados e as metas de rebalanceamento.

1. **Navegue até a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências do servidor:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um arquivo chamado `.env` na raiz da pasta `backend` com a seguinte estrutura:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/investhub?schema=public"
   JWT_SECRET="insira_uma_chave_secreta_super_segura_aqui"
   ```

4. **Iniciar o Banco de Dados (PostgreSQL via Docker):**
   Com o **Docker Desktop** aberto e rodando no seu computador, execute no terminal:
   ```bash
   docker compose up -d
   ```
   > 💡 *Esse comando baixa e inicia um container PostgreSQL em segundo plano com as credenciais especificadas no arquivo `docker-compose.yml`.*

5. **Criar a Estrutura de Tabelas (Migrações Prisma):**
   Com o banco de dados rodando, crie as tabelas e gere o client do Prisma rodando:
   ```bash
   npx prisma migrate dev --name init
   ```
   *(Opcional) Popule o banco com dados de teste iniciais (Seed) rodando:*
   ```bash
   npx prisma db seed
   ```

6. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   O servidor backend estará ativo no endereço: **`http://localhost:3001`**

---

### 3️⃣ Passo 3: Configurar e Iniciar o Frontend
Agora vamos rodar a interface visual da aplicação.

1. **Abra uma nova janela do terminal na pasta raiz do projeto (`investhub`):**
   *(Se estiver no terminal anterior, volte um nível usando `cd ..`)*

2. **Instale as dependências do frontend:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente do Frontend:**
   Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:
   ```env
   VITE_API_URL="http://localhost:3001"
   GEMINI_API_KEY="SUA_CHAVE_API_DO_GEMINI_AQUI"
   ```
   > 💡 *A variável `VITE_API_URL` aponta para a API que acabamos de subir. `GEMINI_API_KEY` é opcional e serve para liberar análises com inteligência artificial direto no painel.*

4. **Iniciar a Aplicação Web:**
   ```bash
   npm run dev
   ```
   A plataforma estará disponível para acesso no navegador no endereço: **`http://localhost:5173`** (ou a porta exibida no terminal).

---

## 🗄️ Como Compartilhar o Banco de Dados entre Computadores?

Uma dúvida comum ao rodar o sistema em mais de um computador é: **"Como posso ter as mesmas informações, ativos e cadastros sincronizados em todos os computadores?"**

Como por padrão o banco de dados roda localmente na sua máquina (`localhost`), os computadores não compartilham dados automaticamente. Abaixo estão as **três melhores soluções** organizadas por facilidade e caso de uso:

---

### 🌐 Opção A: Banco de Dados na Nuvem (Recomendado & Mais Fácil)
A forma mais prática e robusta de compartilhar os dados em tempo real é mover o banco de dados PostgreSQL do Docker local para um serviço de nuvem gratuito. Assim, qualquer computador conectado à internet acessará os mesmos dados.

#### Serviços Recomendados (Gratuitos):
1. **[Neon (neon.tech)](https://neon.tech/)**: Banco PostgreSQL "serverless" extremamente rápido. O plano gratuito é mais do que suficiente para o InvestHub.
2. **[Supabase (supabase.com)](https://supabase.com/)**: Plataforma Open Source que disponibiliza um banco PostgreSQL completo na nuvem com plano gratuito generoso.

#### Passo a Passo para Configurar:
1. Crie uma conta gratuita em um dos serviços acima (ex: Neon.tech).
2. Crie um novo projeto/banco de dados chamado `investhub`.
3. O serviço gerará uma string de conexão (Connection String), que se parece com isso:
   `postgresql://neondb_owner:senha_segura@ep-nome-servidor.us-east-2.aws.neon.tech/investhub?sslmode=require`
4. **No computador principal e nos demais computadores:**
   Edite o arquivo `backend/.env` e substitua a variável `DATABASE_URL` pela string gerada na nuvem:
   ```env
   DATABASE_URL="postgresql://neondb_owner:senha_segura@ep-nome-servidor.us-east-2.aws.neon.tech/investhub?sslmode=require"
   ```
5. Rode o comando de migração para estruturar o banco na nuvem pela primeira vez (pode ser feito de qualquer uma das máquinas):
   ```bash
   npx prisma migrate dev
   ```
6. **Pronto!** A partir de agora, qualquer alteração, compra de ativo ou cadastro feito em qualquer computador atualizará o banco de dados na nuvem instantaneamente, mantendo as informações idênticas em tempo real!

---

### 📶 Opção B: Compartilhamento via Rede Local (Mesmo Wi-Fi)
Se os computadores estiverem conectados na **mesma rede Wi-Fi/Internet local**, você pode manter o banco rodando no Docker de uma única máquina (que funcionará como "Servidor") e conectar as outras máquinas a ela.

#### Passo a Passo para Configurar:
1. **No computador principal (Servidor):**
   * Descubra o IP local da máquina na rede. No Windows, abra o PowerShell e digite `ipconfig` (procure pelo campo *Endereço IPv4*, ex: `192.168.1.15`).
   * Certifique-se de que o Docker PostgreSQL está rodando normalmente nesta máquina.
   * Certifique-se de liberar a porta `5432` no Firewall do Windows para conexões vindas da rede local.

2. **Nos outros computadores (Clientes):**
   * No arquivo `backend/.env`, substitua `localhost` pelo IP local do computador principal:
     ```env
     DATABASE_URL="postgresql://postgres:postgres@192.168.1.15:5432/investhub?schema=public"
     ```
   * *Opcional:* Se você subir a API Backend no computador principal também, as outras máquinas podem rodar apenas o Frontend apontando a variável `VITE_API_URL` para o IP do computador principal (ex: `VITE_API_URL="http://192.168.1.15:3001"`).

---

### 💾 Opção C: Backup e Restauração Manual (Sincronização offline)
Se você não deseja expor o banco na internet e os computadores não compartilham a mesma rede, você pode exportar os dados de um computador e importar no outro periodicamente usando arquivos `.sql`.

#### Como Exportar (Computador A):
No terminal da máquina que tem os dados atualizados, execute o comando do Postgres para gerar um arquivo de backup:
```bash
docker exec -t backend-db-1 pg_dump -U postgres -d investhub > backup_investhub.sql
```
*(Nota: Substitua `backend-db-1` pelo nome exato do container Docker do seu banco, que você pode conferir com o comando `docker ps`)*.

#### Como Importar (Computador B):
Envie o arquivo `backup_investhub.sql` para o computador de destino. Com o Docker do banco rodando no computador B, execute:
```bash
docker exec -i backend-db-1 psql -U postgres -d investhub < backup_investhub.sql
```

---

## 🛠️ Comandos Úteis do Docker

Aqui estão os comandos seguros para gerenciar o container do banco local sem risco de perda de dados:

*   **Ligar o banco de dados (segundo plano):**
    ```bash
    docker compose up -d
    ```
*   **Parar o banco temporariamente (salva os dados no volume):**
    ```bash
    docker compose stop
    ```
*   **Reiniciar o banco:**
    ```bash
    docker compose restart
    ```
*   ⚠️ **CUIDADO (Apagar dados):**
    ```bash
    docker compose down -v
    ```
    *Evite rodar o comando com a flag `-v`, pois ela removerá o volume do Docker onde seus ativos e usuários estão armazenados fisicamente.*

---

## 🤝 Contribuição e Suporte

Caso encontre algum erro de conexão ou configuração ao subir o projeto em outros dispositivos, verifique:
1. Se as portas `3001` (backend) e `5432` (postgres) não estão sendo usadas por outras aplicações.
2. Se o Docker Desktop está ativo.
3. Se os arquivos `.env` (backend) e `.env.local` (frontend) foram criados e preenchidos corretamente nas pastas correspondentes.
