# Guia de Backup e Restauração - Invest Hub

Este guia explica como gerar um backup completo do projeto Invest Hub (código-fonte + dados do banco de dados), empacotá-lo e executá-lo em qualquer outra máquina do zero.

---

## 💾 Parte 1: Como gerar o Backup dos Dados Atuais

Para salvar os dados que estão atualmente no seu banco de dados local:

1. Certifique-se de que o **Docker Desktop** está aberto e rodando.
2. Abra o terminal na pasta **`backend`** e inicie o banco de dados caso ele não esteja ativo:
   ```bash
   docker compose up -d
   ```
3. Com o banco rodando, execute o comando de exportação na pasta **`backend`**:
   ```bash
   npm run export-db
   ```
4. Este comando criará o arquivo **`backend/prisma/seed_backup.json`** contendo todos os usuários, ativos cadastrados, históricos de evolução e metas de rebalanceamento.

> [!NOTE]
> Este arquivo `seed_backup.json` contém as senhas de forma criptografada (hash). Ao restaurar, você poderá fazer login com o mesmo e-mail e senha de antes normalmente.

---

## 📦 Parte 2: Como empacotar o Projeto para transporte

Para enviar o projeto para outra máquina, você deve compactar a pasta do projeto, mas **deve excluir pastas temporárias pesadas** que podem ser reconstruídas automaticamente.

### O que compactar (Adicionar ao arquivo ZIP):
- Pasta `components/`
- Pasta `services/`
- Pasta `backend/` (Certifique-se de que o arquivo `backend/prisma/seed_backup.json` está dentro dela!)
- Arquivo `App.tsx`
- Arquivo `index.html`
- Arquivo `package.json` e `package-lock.json`
- Arquivo `vite.config.ts`
- Arquivo `tsconfig.json`
- Arquivo `README_BACKUP.md` (este guia)

### O que **NÃO** compactar (Excluir do ZIP para ficar leve):
- 🛑 **`node_modules/`** (da raiz e de dentro de `backend/`) - Serão recriados com `npm install`.
- 🛑 **`dist/`** ou **`.vite/`** (pastas de build temporárias).
- 🛑 **`.git/`** (se não precisar do histórico do Git).

---

## 🚀 Parte 3: Como rodar o Projeto em outra Máquina (Passo a Passo)

### Pré-requisitos na Nova Máquina
1. **Node.js** (versão 18 ou superior) instalado.
2. **Docker Desktop** instalado e rodando.

---

### Passo 1: Extrair e Instalar Dependências

1. Extraia o arquivo ZIP na nova máquina.
2. Abra o terminal na **pasta raiz** do projeto extraído e instale as dependências do frontend:
   ```bash
   npm install
   ```
3. Navegue para a pasta **`backend`** e instale as dependências do backend:
   ```bash
   cd backend
   npm install
   ```

---

### Passo 2: Configurar o Banco de Dados

1. Ainda na pasta **`backend`**, verifique se o arquivo `.env` existe. Ele deve conter as configurações padrão (que já vêm no projeto):
   ```env
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/assetflow_db?schema=public"
   JWT_SECRET="sua_chave_secreta_super_segura"
   ```
2. Inicie o container do banco de dados PostgreSQL rodando:
   ```bash
   docker compose up -d
   ```
3. Aguarde alguns segundos para o banco de dados inicializar. Em seguida, crie a estrutura de tabelas no banco executando as migrações do Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```

---

### Passo 3: Restaurar os Dados do Backup

1. Para restaurar os dados do backup que você gerou na Parte 1, execute o comando de semente (seed) na pasta **`backend`**:
   ```bash
   npx prisma db seed
   ```
   *O sistema detectará automaticamente o arquivo `seed_backup.json` e restaurará todas as suas contas, ativos e históricos exatamente como estavam.*

---

### Passo 4: Iniciar a Aplicação

Agora que tudo está configurado e os dados foram restaurados, basta rodar os servidores:

1. **Iniciar o Backend**:
   Na pasta `backend`, execute:
   ```bash
   npm run dev
   ```
2. **Iniciar o Frontend**:
   Abra um **segundo terminal** na pasta raiz do projeto e execute:
   ```bash
   npm run dev
   ```
3. **Acesse no Navegador**:
   Abra o navegador no endereço **http://localhost:3000** e faça login com as suas credenciais.
