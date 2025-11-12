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
  - `NEON_DATABASE_URL` (**required**) – string de conexão do banco Neon (ex.: `postgresql://usuario:senha@servidor.neon.tech/neondb`).
  - `APP_BASE_URL` (**recomendado**) – URL pública do app para compor o link de confirmação de e-mail enviado aos usuários.
  - `API_BASE_URL` (opcional) – URL pública da API; usada como fallback para gerar o link de confirmação.
  - `RESEND_API_KEY` (opcional) – chave da API do [Resend](https://resend.com/) usada para envio de e-mails transacionais.
  - `EMAIL_SENDER` (opcional) – endereço exibido como remetente nos e-mails de confirmação.
  - `SESSION_TOKEN_TTL_DAYS` (opcional) – tempo de expiração dos tokens de sessão em dias (padrão: `30`).

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

### Autenticação e banco de dados Neon

- A API agora mantém as tabelas de usuários, orações, terços, plano de vida, progresso do plano, notas, preferências de IA e progresso dos terços diretamente no Postgres do Neon. As estruturas são criadas automaticamente na primeira execução se `NEON_DATABASE_URL` estiver configurada.
- O cadastro de novos usuários exige confirmação de e-mail. Configure `RESEND_API_KEY` e `EMAIL_SENDER` para enviar o link de ativação pelo serviço Resend. Caso a API de e-mail não esteja disponível, o sistema registra o usuário e exibe uma mensagem para reenviar o link posteriormente.
- As preferências de modelo de IA são sincronizadas com a tabela `ai_model_preferences` sempre que o usuário autenticado altera a opção em **Configurações**. Usuários convidados continuam utilizando o armazenamento local.
- Sessões autenticadas utilizam tokens persistidos na tabela `user_sessions`. Ajuste `SESSION_TOKEN_TTL_DAYS` se desejar alterar o tempo padrão de validade (30 dias).
- Usuários sem login podem optar pelo modo convidado e terão acesso apenas às abas **Home**, **Orações** e **Terços**. As demais telas exibem um aviso solicitando autenticação.

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
