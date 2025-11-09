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
  - `AUTH_JWT_SECRET` (**required**) – chave usada para assinar os tokens JWT enviados ao aplicativo.
  - `COSMOS_DB_ENDPOINT` e `COSMOS_DB_KEY` (**required**) – endpoint e chave primária da conta do Azure Cosmos DB.
  - `COSMOS_DB_DATABASE_ID` (opcional) – banco de dados que armazena os documentos da aplicação. O valor padrão é `daily-prayers`.
  - `COSMOS_DB_USERS_CONTAINER`, `COSMOS_DB_NOTES_CONTAINER`, `COSMOS_DB_LIFE_PLANS_CONTAINER`, `COSMOS_DB_MODEL_SETTINGS_CONTAINER` (opcionais) – nomes dos contêineres do Cosmos DB. Os valores padrão são `users`, `notes`, `lifePlans` e `modelSettings`.

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

### Banco de dados Azure Cosmos DB (Free Tier)

1. Escolha um grupo de recursos e região (ex.: `brazilsouth`) e crie a conta gratuita do Cosmos DB:

   ```bash
   az group create --name daily-prayers-rg --location brazilsouth
   az cosmosdb create \
     --name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --locations regionName=brazilsouth failoverPriority=0 \
     --default-consistency-level Session \
     --kind GlobalDocumentDB \
     --enable-free-tier true
   ```

2. Crie o banco de dados SQL e os quatro contêineres utilizados pela aplicação:

   ```bash
   az cosmosdb sql database create \
     --account-name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --name daily-prayers

   az cosmosdb sql container create \
     --account-name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --database-name daily-prayers \
     --name users \
     --partition-key-path "/id"

   az cosmosdb sql container create \
     --account-name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --database-name daily-prayers \
     --name notes \
     --partition-key-path "/userId"

   az cosmosdb sql container create \
     --account-name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --database-name daily-prayers \
     --name lifePlans \
     --partition-key-path "/userId"

   az cosmosdb sql container create \
     --account-name daily-prayers-account \
     --resource-group daily-prayers-rg \
     --database-name daily-prayers \
     --name modelSettings \
     --partition-key-path "/userId"
   ```

3. Recupere o endpoint e a chave primária para configurar as funções:

   ```bash
   az cosmosdb show --name daily-prayers-account --resource-group daily-prayers-rg --query "documentEndpoint" -o tsv
   az cosmosdb keys list --name daily-prayers-account --resource-group daily-prayers-rg --type keys --query "primaryMasterKey" -o tsv
   ```

4. Preencha as variáveis `COSMOS_DB_ENDPOINT` e `COSMOS_DB_KEY` em `api/local.settings.json` (ou nos secrets do ambiente de produção). Os contêineres são opcionais, mas é recomendável mantê-los com os nomes padrão informados acima. Defina também um valor forte para `AUTH_JWT_SECRET`.

### Autenticação e persistência de dados

- A aplicação agora apresenta uma tela de login que libera a navegação somente após autenticação bem-sucedida. O fluxo de cadastro grava o usuário no contêiner `users` do Cosmos DB e provisiona automaticamente um plano de vida e configurações padrão.
- Todas as funcionalidades dinâmicas passaram a ser persistidas no banco:
  - **Anotações** são salvas no contêiner `notes` e ficam disponíveis em qualquer dispositivo autenticado.
  - **Plano de vida** é sincronizado no contêiner `lifePlans`, garantindo que práticas e períodos concluídos sejam mantidos.
  - **Preferências de modelos IA** são centralizadas no contêiner `modelSettings`, permitindo reuso entre sessões.
- Tokens JWT são armazenados de forma criptografada no backend e enviados ao app, que os guarda em armazenamento seguro para revalidação automática da sessão.

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
