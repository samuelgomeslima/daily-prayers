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
   - `EXPO_PUBLIC_SUPABASE_URL` (**required**) – base URL of your Supabase project (Dashboard → Settings → API → Project URL).
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (**required**) – anon/public API key used by the mobile client to authenticate with Supabase.

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

### Integração com Supabase

1. Ative o provedor de e-mail/senha no painel do Supabase (Authentication → Providers → Email) e defina se os cadastros precisam de confirmação por e-mail.
2. Crie as tabelas necessárias usando o editor SQL do Supabase (Database → SQL editor) executando o script abaixo. Ele habilita RLS e cria políticas básicas que garantem que cada usuário só consiga acessar os próprios registros.

   ```sql
   create extension if not exists "pgcrypto";

   -- Notas pessoais
   create table if not exists public.notes (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users (id) on delete cascade,
     title text,
     content text,
     updated_at timestamptz not null default timezone('utc', now())
   );
   alter table public.notes enable row level security;
   create policy "Notes are scoped per user" on public.notes
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   -- Plano de vida espiritual
   create table if not exists public.life_plan_practices (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users (id) on delete cascade,
     title text not null,
     description text,
     frequency text not null,
     is_default boolean not null default false,
     completed_periods jsonb not null default '[]'::jsonb,
     created_at timestamptz not null default timezone('utc', now()),
     updated_at timestamptz not null default timezone('utc', now())
   );
   alter table public.life_plan_practices enable row level security;
   create policy "Life plan per user" on public.life_plan_practices
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   -- Histórico de conversas com a IA
   create table if not exists public.chat_messages (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users (id) on delete cascade,
     role text not null check (role in ('user', 'assistant')),
     content text not null,
     created_at timestamptz not null default timezone('utc', now())
   );
   alter table public.chat_messages enable row level security;
   create policy "Chat messages per user" on public.chat_messages
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   -- Preferências de modelos de IA
   create table if not exists public.model_settings (
     user_id uuid primary key references auth.users (id) on delete cascade,
     catechist_model text not null,
     chat_model text not null,
     updated_at timestamptz not null default timezone('utc', now())
   );
   alter table public.model_settings enable row level security;
   create policy "Model settings per user" on public.model_settings
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

3. No arquivo `.env` (ou nos segredos do ambiente CI/CD), defina `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` com os valores copiados do painel (Settings → API). O app grava a sessão autenticada no armazenamento seguro do dispositivo e renova o token automaticamente.
4. Após atualizar as variáveis de ambiente, reinicie o Metro bundler (`npx expo start --clear`) para garantir que o bundle receba os novos valores.

Com essa configuração, todas as funcionalidades — plano de vida, anotações, histórico do chat e preferências de modelos — passam a ser persistidas no Supabase e ficam disponíveis em qualquer dispositivo autenticado com o mesmo usuário.

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
