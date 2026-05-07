# AssetFlow Intelligence - Backend API

Backend robusto desenvolvido em Node.js para suportar a plataforma de gestão de patrimônio AssetFlow. Este sistema gerencia persistência de ativos, histórico de evolução patrimonial e metas de rebalanceamento.

## 🛠 Tecnologias Utilizadas

- **Node.js & Express**: Servidor HTTP de alta performance.
- **TypeScript**: Tipagem estática para segurança e manutenção.
- **Prisma ORM**: Camada de acesso ao banco de dados e gerenciamento de schema.
- **PostgreSQL**: Banco de dados relacional robusto.
- **JWT (JSON Web Token)**: Autenticação stateless segura.
- **Zod**: Validação de esquemas e dados de entrada.

## 🗂 Arquitetura de Dados (Prisma)

O sistema gira em torno do usuário (`User`), que possui:
1.  **Ativos (`Asset`)**: Ações, FIIs, Criptos com quantidade, preço médio e categorização (Macro/Micro).
2.  **Histórico (`PortfolioHistory`)**: Snapshots temporais do valor total para geração de gráficos.
3.  **Metas (`TargetAllocation`)**: Preferências de alocação do usuário para o módulo de rebalanceamento inteligente.

## 🚀 Como Rodar o Projeto

### Pré-requisitos
*   Node.js (v18 ou superior)
*   Docker (para rodar o Postgres) OU uma instância local de Postgres instalada.

### Passo 1: Configuração

Clone o repositório e instale as dependências:
```bash
git clone <url-do-repo>
cd assetflow-backend
npm install
```

### Passo 2: Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3001
# Exemplo de URL Local ou Docker
DATABASE_URL="postgresql://user:password@localhost:5432/assetflow_db?schema=public"
JWT_SECRET="seu_segredo_super_seguro"
```

### Passo 3: Banco de Dados
Suba o banco de dados (se usar Docker Compose) e rode as migrações:
```bash
# Subir banco (opcional, se usar Docker)
docker compose up -d

# Cria as tabelas no banco baseado no schema.prisma
npx prisma migrate dev --name init
```

### Passo 4: Executar
```bash
# Modo de desenvolvimento (com hot-reload)
npm run dev

# Modo de produção
npm run build
npm start
```

## 📡 Documentação da API

### Auth
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| POST | `/auth/register` | Cria nova conta (email, password, name) |
| POST | `/auth/login` | Retorna o Token JWT |

### Ativos (Requer Header `Authorization: Bearer <token>`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| GET | `/assets` | Lista todos os ativos do usuário |
| POST | `/assets` | Adiciona um novo ativo |
| PUT | `/assets/:id` | Atualiza Qtd, Preço ou Categoria |
| DELETE | `/assets/:id` | Remove um ativo |
| POST | `/assets/batch` | Atualização em lote (usado no rebalanceamento) |

### Rebalanceamento & Metas
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| GET | `/rebalance/targets` | Recupera as % alvo definidas pelo usuário |
| POST | `/rebalance/targets` | Salva novas % alvo para categorias/subcategorias |

### Histórico
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| GET | `/history` | Retorna array de histórico patrimonial |
