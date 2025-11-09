# Daily Prayers – Guia de desenvolvimento

Aplicativo Expo voltado à oração diária com backend em Azure Functions. As principais funcionalidades (anotações, plano de vida, progresso do terço e configurações de modelo) agora dependem de autenticação e são persistidas em um banco PostgreSQL hospedado na [Neon](https://neon.tech/).

## Pré-requisitos

- Node.js **20.19.4 ou superior** (veja [`.nvmrc`](.nvmrc)).
- Expo CLI (`npm install -g expo-cli`) opcionalmente para uso local.
- [Azure Functions Core Tools 4](https://learn.microsoft.com/azure/azure-functions/functions-run-local) para executar a API em desenvolvimento.
- Conta gratuita na Neon (Free Tier) e acesso à CLI `psql`.

## Instalação das dependências

```bash
npm install
npm install --prefix api
```

## Configuração do banco na Neon (Free Tier)

1. Crie uma conta em [neon.tech](https://neon.tech) e inicie um projeto PostgreSQL gratuito.
2. No painel da Neon, acesse **SQL Editor** e execute o script de schema localizado em [`api/db/schema.sql`](api/db/schema.sql). Se preferir a linha de comando:

   ```bash
   # substitua <connection-string> pela string fornecida pela Neon
   psql "<connection-string>" -f api/db/schema.sql
   ```

3. Ainda no painel, gere uma Connection String no formato `postgres://usuario:senha@servidor/db`. Essa será a variável `DATABASE_URL` usada pela API.
4. Opcional: defina um branch adicional para testes, caso precise de ambientes separados (o schema funciona em qualquer branch porque utiliza `create table if not exists`).

## Variáveis de ambiente

### Aplicativo Expo (`.env`)

```bash
cp .env.example .env
```

- `EXPO_PUBLIC_CHAT_BASE_URL` – URL pública do frontend/Static Web App.
- `EXPO_PUBLIC_API_BASE_URL` – URL base das Azure Functions (ex.: `https://<sua-app>.azurewebsites.net/api`). Informe esta variável em desenvolvimento para apontar para o Functions host local (ex.: `http://localhost:7071/api`).
- Outras variáveis opcionais descritas no arquivo de exemplo.

### Azure Functions (`api/local.settings.json`)

```bash
cp api/local.settings.example.json api/local.settings.json
```

Preencha os valores obrigatórios:

- `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_CATECHIST_AGENT_ID` etc. conforme já documentado.
- `DATABASE_URL` – connection string da Neon.
- `JWT_SECRET` – chave aleatória segura (ex.: `openssl rand -hex 32`).
- `JWT_EXPIRES_IN` – tempo de expiração (padrão `7d`).

No Azure (produção), configure as mesmas chaves no painel de **Configuration** da Function App. Lembre-se de ativar TLS na Neon (já exigido pela connection string com `sslmode=require`).

## Provisionando o primeiro usuário

As rotas agora exigem autenticação. Crie um usuário inicial via endpoint `POST /api/auth/register` (substitua `<API_BASE>` pela URL configurada):

```bash
curl -X POST "<API_BASE>/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Administrador",
        "email": "admin@example.com",
        "password": "senha-segura"
      }'
```

O endpoint retorna `token` e `user`. Use esse token em chamadas subsequentes ou faça login pelo aplicativo (`/auth/login`).

## Executando em desenvolvimento

1. Inicie o backend:

   ```bash
   cd api
   npm install  # caso ainda não tenha feito
   npm run start
   ```

   O Functions Core Tools sobe em `http://localhost:7071`. Certifique-se de que `DATABASE_URL` e `JWT_SECRET` estão configurados no `local.settings.json`.

2. Em outro terminal, execute o app Expo:

   ```bash
   npx expo start
   ```

   Ao usar dispositivos físicos, defina `EXPO_PUBLIC_API_BASE_URL=http://<IP_LOCAL>:7071/api` para que o app encontre a API.

## Autenticação e fluxo do app

- A tela de login está em [`app/login.tsx`](app/login.tsx). Ela consome o endpoint `/auth/login` e persiste a sessão com [`utils/auth-storage.ts`](utils/auth-storage.ts).
- Todo o roteamento é protegido em [`app/_layout.tsx`](app/_layout.tsx); apenas usuários autenticados acessam as abas principais.
- A sessão é revalidada no carregamento via [`contexts/auth-context.tsx`](contexts/auth-context.tsx), que consulta `/auth/profile` e renova o usuário armazenado.

## Persistência em banco de dados

| Recurso            | Tela/Hook                                         | Endpoint / Função Azure                     |
| ------------------ | ------------------------------------------------- | ------------------------------------------- |
| Anotações          | [`app/notes.tsx`](app/notes.tsx)                  | [`api/src/functions/notes.js`](api/src/functions/notes.js) |
| Plano de Vida      | [`app/life-plan.tsx`](app/life-plan.tsx)          | [`api/src/functions/life-plan*.js`](api/src/functions/)   |
| Progresso do Terço | [`app/(tabs)/rosaries.tsx`](app/(tabs)/rosaries.tsx) | [`api/src/functions/rosary-progress.js`](api/src/functions/rosary-progress.js) |
| Configurações IA   | [`contexts/model-settings-context.tsx`](contexts/model-settings-context.tsx) | [`api/src/functions/model-settings.js`](api/src/functions/model-settings.js) |

Todos os handlers usam o helper de autenticação [`api/src/lib/auth-middleware.js`](api/src/lib/auth-middleware.js) para validar o token JWT antes de acessar o banco Neon.

## Deploy

1. Execute `npm install --prefix api` em sua máquina local para gerar/atualizar o `package-lock.json` (o ambiente desta documentação não possui acesso à registry da npm).
2. Faça o deploy das funções para o Azure (por exemplo, via GitHub Actions configurada pela Static Web App).
3. Defina as variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `OPENAI_*`) tanto na Function App quanto na Static Web App.
4. Certifique-se de que a Static Web App define `EXPO_PUBLIC_API_BASE_URL` apontando para a função publicada.

## Dicas adicionais

- A Neon exige SSL; mantenha `sslmode=require` na connection string.
- Para resetar a base, basta executar novamente `api/db/schema.sql` ou truncar tabelas manualmente (`truncate table ... cascade`).
- O token expira conforme `JWT_EXPIRES_IN`. Quando expirar, o app retornará à tela de login.

## Recursos úteis

- [Documentação Expo](https://docs.expo.dev/)
- [Azure Functions – desenvolver localmente](https://learn.microsoft.com/azure/azure-functions/functions-develop-local)
- [Neon Docs](https://neon.tech/docs)

