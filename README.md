# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Use Node.js 20

   The Expo SDK 54 toolchain bundled with this project requires Node.js **20.19.4 or newer**. If you use [`nvm`](https://github.com/nvm-sh/nvm), you can switch to the correct version with:

   ```bash
   nvm use
   ```

   The repository includes an [`.nvmrc`](.nvmrc) file to simplify selecting the right runtime. If you do not use `nvm`, install Node.js 20.19.4 manually before proceeding.

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure environment variables

   Copy the example environment file and fill in the Expo variables required by the client app.

   ```bash
   cp .env.example .env
   ```

   - `EXPO_PUBLIC_CHAT_BASE_URL` (**required**) – full URL of your deployed Static Web App (e.g. `https://white-ground-0a882961e.1.azurestaticapps.net/`).
   - `EXPO_PUBLIC_API_BASE_URL` (optional) – fallback base URL if the chat URL is not defined.
   - `EXPO_PUBLIC_SITE_URL` (optional) – secondary fallback used in development builds.

   The runtime now resolves these endpoints in a strict order: **chat first, then API, then site**. If you define multiple values, the app always uses `EXPO_PUBLIC_CHAT_BASE_URL` when present. When that value is missing, it falls back to `EXPO_PUBLIC_API_BASE_URL`, and only uses `EXPO_PUBLIC_SITE_URL` if both other variables are absent.
   - `EXPO_PUBLIC_CATECHIST_BASE_URL` (optional) – dedicated endpoint for the catechist agent; defaults to the chat base URL when omitted.

   If you plan to run the Azure Functions locally, copy the API template and provide the required credentials.

   ```bash
   cp api/local.settings.example.json api/local.settings.json
   ```

   - `OPENAI_API_KEY` (**required**) – server-side key used by every OpenAI call.
   - `OPENAI_CHAT_MODEL` (optional) – defaults to `gpt-4o-mini`.
   - `OPENAI_CATECHIST_AGENT_ID` (**required for the catechist assistant**) – ID of the workflow created in OpenAI.
   - `OPENAI_CATECHIST_MODEL` (optional) – defaults to `gpt-4o-mini`.
   - `OPENAI_CATECHIST_MAX_TOKENS` (optional) – defaults to `8192`.
   - `FILE_SEARCH_TOOL` (optional) – ID of a configured file search tool for the catechist agent.
   - `OPENAI_TRANSCRIBE_MODEL` (optional) – defaults to `gpt-4o-mini-transcribe`.
   - `OPENAI_PROXY_TOKEN` (optional) – token required to call the transcription proxy when set.
  - `NEON_DATABASE_URL` (**required for the notas module when using direct SQL access**) – Postgres connection string provided by Neon (e.g. `postgres://USER:PASSWORD@ep-restful-12345.us-east-1.aws.neon.tech/neondb`).
  - `NEON_DATA_API_URL` (optional) – Neon Data API endpoint such as `https://<your-endpoint>/neondb/rest/v1`. When this is set the API will automatically route all database reads and writes through Neon’s Data API instead of the classic SQL-over-HTTP endpoint.
  - `NEON_DATA_API_KEY` (optional) – API key generated in the Neon dashboard. Required when `NEON_DATA_API_URL` is defined.

   The API expects the connection string to include user, password, host and database. Neon already enforces TLS; keep the `sslmode=require` suffix if it is present in the generated URL.

### Conectar ao banco de dados Neon

1. Crie um projeto no [Neon](https://neon.tech/) e copie a **connection string** em formato `postgres://` (abra a aba **Connection Details** → **PSQL**).
2. Execute o script [`api/sql/schema.sql`](api/sql/schema.sql) no banco recém-criado para gerar as tabelas necessárias:

   ```bash
   psql "$NEON_DATABASE_URL" -f api/sql/schema.sql
   ```

   > Se preferir usar o console online da Neon, cole o conteúdo do arquivo `schema.sql` diretamente no editor SQL e execute o script.

3. Defina as variáveis `NEON_DATABASE_URL` **ou** (`NEON_DATA_API_URL` + `NEON_DATA_API_KEY`) no ambiente das Azure Functions (localmente em `api/local.settings.json` e no portal do Azure/Static Web Apps para produção).
4. Configure `EXPO_PUBLIC_API_BASE_URL` apontando para a URL pública do aplicativo (a mesma utilizada para o chat). Se múltiplas variáveis forem definidas, o aplicativo usará, nesta ordem, `EXPO_PUBLIC_CHAT_BASE_URL`, depois `EXPO_PUBLIC_API_BASE_URL` e, por fim, `EXPO_PUBLIC_SITE_URL`. A aplicação móvel consumirá os endpoints REST abaixo:

   - `POST /api/users/register` – cria usuários e retorna o token de sessão;
   - `POST /api/users/login` – autentica e renova o token;
   - `GET /api/notes` – lista apenas as anotações do usuário autenticado;
   - `POST /api/notes` – cria novas anotações;
   - `PUT /api/notes/{id}` – atualiza uma anotação existente pertencente ao usuário;
   - `DELETE /api/notes/{id}` – remove anotações do próprio usuário.

Somente usuários autenticados podem criar, editar ou visualizar anotações. O token retornado pelos endpoints de cadastro/login deve ser enviado no cabeçalho `Authorization: Bearer <token>` em todas as operações relacionadas a notas.

### Usando a Neon Data API

Para um passo a passo completo de como habilitar o Data API, configurar variáveis de ambiente e testar consultas utilizando o endpoint REST, consulte o guia [api/NEON_DATA_API_GUIDE.md](api/NEON_DATA_API_GUIDE.md).

   > [!TIP]
   > `EXPO_PUBLIC_CHAT_BASE_URL` must be available **wherever the Expo bundle is built** so that native apps can call the proxy. When Azure Static Web Apps builds the project via the generated GitHub Action, define this variable as a GitHub repository secret (Settings → Secrets and variables → Actions) and expose it in the workflow. If you build elsewhere, configure the same variable in that environment before running `expo start`/`expo export`.

4. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Guia de implementação

### Configuração do Assistente Catequista

1. No portal do OpenAI, copie o **ID do agente** que você criou (Assistants → seu agente → "Agent ID").
2. No Azure Static Web Apps (ou no ambiente onde as funções estão rodando), defina as variáveis **OPENAI_API_KEY** e **OPENAI_CATECHIST_AGENT_ID** com os valores correspondentes.
3. Se quiser testar em dispositivos físicos, exponha o endpoint configurando **EXPO_PUBLIC_CATECHIST_BASE_URL** (ou reutilize **EXPO_PUBLIC_CHAT_BASE_URL**) apontando para a URL pública da Static Web App.
4. Publique as alterações. Depois que as funções forem atualizadas, abra a aba do assistente e envie uma mensagem para validar se o agente está respondendo conforme o esperado.

### Recursos oficiais do Vaticano

- Acesse diretamente o portal [vatican.va](https://www.vatican.va/content/vatican/pt.html) para consultar constituições apostólicas, homilias e documentos litúrgicos da Santa Sé, preservando a experiência original publicada pelo Vaticano.
- As notícias em português do [vaticannews.va](https://www.vaticannews.va/pt.html) são abertas no navegador do dispositivo, evitando bloqueios de incorporação e seguindo as diretrizes canônicas de uso dos portais oficiais.

### Fluxo da Liturgia Diária (Canção Nova)

- Sincronização diária com [liturgia.cancaonova.com](https://liturgia.cancaonova.com/pb/) garantindo que leituras, salmos e orações sigam a publicação oficial disponibilizada pela comunidade Canção Nova.
- Implementamos cache local apenas para uso offline de curto prazo e exibimos aviso sobre a procedência da fonte em todas as telas relacionadas.

### Santo do Dia com cache e créditos

- Dados carregados de portais autorizados (ex.: [Canção Nova](https://santo.cancaonova.com/)) e armazenados por 24 horas. Após esse período, uma nova requisição é realizada e os créditos são mantidos visíveis no card do santo.
- Implementamos fallback para quando não há conteúdo atualizado, exibindo mensagem amigável e link direto para a fonte.

### Cadastro manual de horários de missa

- Como não existe API nacional, adotamos formulários de envio no aplicativo. As entradas ficam associadas à paróquia e são revisadas antes da publicação.
- Também oferecemos deep links para os guias oficiais da Arquidiocese de Belo Horizonte, com horários publicados em [missadiariabh.com/missadiaria](https://www.missadiariabh.com/missadiaria) e as agendas de confissões em [missadiariabh.com/confissoes](https://www.missadiariabh.com/confissoes) para complementar a busca do usuário.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
