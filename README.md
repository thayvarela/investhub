<div align="center">
  <img width="1200" height="475" alt="InvestHub Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🚀 InvestHub (AssetFlow Intelligence)
  
  **A plataforma inteligente de gestão de patrimônio, controle de ativos e rebalanceamento dinâmico.**
  
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org)
  [![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vite.dev)
  [![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://react.dev)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://prisma.io)
  [![Database](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-00E599.svg)](https://neon.tech)
</div>

---

## 📋 Sobre o Projeto

O **InvestHub** é uma solução completa para investidores gerenciarem carteiras de investimentos com rebalanceamento matemático de precisão. O sistema calcula a distribuição por categorias (Ações, FIIs, Cripto, Exterior, etc.), monitora variações em tempo real e emite recomendações automáticas de aportes ideais.

* **Frontend:** Single Page Application moderna em React 19, TypeScript, Vite, TailwindCSS e Recharts.
* **Backend:** API REST em Node.js, Express, TypeScript e Prisma ORM.
* **Banco de Dados na Nuvem:** Hospedado no **Neon PostgreSQL** (serverless na nuvem AWS São Paulo). **Você NÃO precisa instalar Docker localmente!** Todos os dados já estão salvos e sincronizados na nuvem em tempo real.

---

## 💻 Guia Definitivo: Do Zero ao WSL 2 em Qualquer Computador

Se você acabou de formatar sua máquina ou deseja rodar o projeto em um computador novo (com Windows 10/11), siga este guia passo a passo para deixar seu ambiente 100% isolado, rápido e sem poluir o Windows.

> *(Se estiver no Linux nativo ou macOS, pule o Passo 1 e vá direto para o Passo 2)*.

---

### 1️⃣ Passo 1: Habilitar o WSL 2 (Ambiente Linux Isolado no Windows)

1. No Windows, abra o menu Iniciar, digite **PowerShell**, clique com o botão direito e selecione **"Executar como Administrador"**.
2. Digite o seguinte comando e aperte Enter:
   ```powershell
   wsl --install
   ```
3. Aguarde o download do Ubuntu. Quando terminar, **reinicie o computador**.
4. Ao reiniciar o Windows, o terminal do Ubuntu abrirá automaticamente para a configuração inicial:
   * **Enter new UNIX username:** escolha um nome de usuário (ex: `thayn`).
   * **New password:** digite uma senha (os caracteres não aparecem na tela, é normal) e repita.

---

### 2️⃣ Passo 2: Instalar Node.js e Ferramentas no Ubuntu

No terminal aberto do **Ubuntu**, vamos instalar o NVM (gerenciador de versões do Node) e o Node.js LTS:

1. **Instale o NVM:**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```

2. **Recarregue o terminal para ativar o NVM:**
   ```bash
   source ~/.bashrc
   ```

3. **Instale o Node.js LTS mais recente:**
   ```bash
   nvm install --lts
   ```

4. **Crie os links globais no Linux** *(Evita que o terminal tente chamar o CMD do Windows acidentalmente)*:
   ```bash
   sudo ln -sf $(which node) /usr/local/bin/node
   sudo ln -sf $(which npm) /usr/local/bin/npm
   sudo ln -sf $(which npx) /usr/local/bin/npx
   ```

5. **Configure o seu Git:**
   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "seu_email@exemplo.com"
   ```

---

### 3️⃣ Passo 3: Clonar o Projeto na Pasta Nativa do Linux

> ⚠️ **ATENÇÃO - REGRA DE OURO:**  
> Nunca clone projetos de desenvolvimento dentro de `/mnt/c/` (disco do Windows), pois o sistema de arquivos compartilhado fica muito lento.  
> Sempre clone dentro da **pasta pessoal do Linux (`~`)** para ter 100% da velocidade do SSD/NVMe!

No terminal do Ubuntu:
```bash
cd ~
mkdir -p projetos && cd projetos
git clone https://github.com/thayvarela/investhub.git
cd investhub
```

---

### 4️⃣ Passo 4: Configurar Variáveis de Ambiente e Dependências

O projeto já inclui arquivos de exemplo prontos (`.env.example` e `.env.local.example`).

#### A) Configurar o Backend:
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
```
*(O arquivo `.env` já virá configurado com a URL do seu banco na nuvem Neon! Se precisar alterar no futuro, basta editar com `nano .env`)*.

#### B) Configurar o Frontend:
```bash
cd ..
cp .env.local.example .env.local
npm install
```

---

### 5️⃣ Passo 5: Como Abrir no VS Code e Rodar o Projeto

#### Abrir no VS Code com extensão WSL:
Dentro da pasta `~/projetos/investhub`, digite:
```bash
code .
```
O VS Code do Windows abrirá conectado diretamente ao Ubuntu! Se for a primeira vez, clique em **"Instalar"** na notificação da extensão oficial *WSL*.

#### Rodar o Projeto (Backend + Frontend juntos):
Criamos um script que inicia os dois servidores automaticamente com apenas um comando:

```bash
./start.sh
```

*(Se preferir rodar em dois terminais separados)*:
* **Terminal 1 (Backend):** `cd backend && npm run dev`
* **Terminal 2 (Frontend):** `npm run dev`

---

### 6️⃣ Passo 6: Acessar a Aplicação

Abra qualquer navegador comum no Windows (Google Chrome, Microsoft Edge, etc.) e acesse:

👉 **`http://localhost:5173`** *(ou a porta informada pelo Vite no terminal)*

Pronto! A aplicação conectará à API e ao banco de dados Neon na nuvem, trazendo instantaneamente todos os seus ativos, históricos e gráficos atualizados!

---

### 🛡️ O "Botão de Pânico" do WSL (Como formatar ou resetar tudo)

A maior vantagem de programar no WSL 2 é que o seu Windows continua puro e rápido. Se um dia você quiser resetar todo o ambiente de desenvolvimento e começar do zero absoluto sem formatar o PC:

1. Abra o PowerShell no Windows e digite:
   ```powershell
   wsl --unregister Ubuntu
   ```
   *(Em 3 segundos, todo o Linux com Node, bibliotecas e pastas de desenvolvimento é apagado sem afetar nada do seu Windows)*.
2. Para reinstalar zerado de fábrica:
   ```powershell
   wsl --install Ubuntu
   ```

---

## 🗄️ Estrutura de Variáveis de Ambiente

### Backend (`backend/.env`)
```env
PORT=3001
DATABASE_URL="postgresql://investhubdb_owner:npg_nQaI8ELyoG1R@ep-falling-cherry-b6q0n4zw-pooler.c-2.sa-east-1.aws.neon.tech/investhubdb?sslmode=require"
JWT_SECRET="sua_chave_secreta_super_segura"
PLUGGY_CLIENT_ID=""
PLUGGY_CLIENT_SECRET=""
BRAPI_TOKEN=""
```

### Frontend (`.env.local`)
```env
VITE_API_URL="http://localhost:3001"
GEMINI_API_KEY=""
```

---

## 🤝 Dúvidas e Soluções Comuns

* **"CMD.EXE foi iniciado tendo o caminho acima como pasta atual" ou "'vite' não é reconhecido":**  
  Esse erro ocorre quando o terminal do Linux tenta chamar o Node do Windows. Para resolver de vez, rode no terminal do Ubuntu:
  ```bash
  sudo ln -sf $(which node) /usr/local/bin/node
  sudo ln -sf $(which npm) /usr/local/bin/npm
  ```
* **"Erro de conexão com o banco de dados":**  
  Verifique se o seu computador está conectado à internet, pois o banco de dados está hospedado no Neon Cloud.
