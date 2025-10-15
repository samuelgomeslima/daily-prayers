const DEFAULT_VECTOR_STORE_ID = 'vs_68ed371236008191be21f3ea164472a7';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_INSTRUCTIONS = `Você é um agente de estudos católicos que responde EXCLUSIVAMENTE com base no livro “A Fé Explicada”, de Leo J. Trese.

Regras:
- Use o arquivo de conhecimento (PDF) para encontrar respostas diretas do livro.
- Não use fontes externas nem opinião pessoal.
- Responda em português, com clareza e fidelidade ao texto.
- Sempre que possível, cite o capítulo, título ou página aproximada (se detectável).
- Se a pergunta não estiver respondida no livro, diga:  
  "Não encontrei uma resposta direta para isso em 'A Fé Explicada'."

Formato de resposta:
1️⃣ **Resumo claro** (máx. 4 linhas).  
2️⃣ **Trecho relevante do livro** entre aspas.  
3️⃣ **Referência** (capítulo/página se disponível).  

Exemplo:
---
**Pergunta:** O que é fé?

**Resposta:**
A fé é a aceitação racional da verdade revelada por Deus.  
> “A fé é uma luz que ilumina a mente e move a vontade a aceitar o que Deus revelou.”  
📖 *Capítulo 1 – A Fé, página 12.*
---`;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.OPENAI_CATECHIST_AGENT_ID ?? null;
const VECTOR_STORE_ID =
  process.env.OPENAI_CATECHIST_VECTOR_STORE_ID ?? DEFAULT_VECTOR_STORE_ID;
const MODEL = process.env.OPENAI_CATECHIST_MODEL ?? DEFAULT_MODEL;
const INSTRUCTIONS =
  process.env.OPENAI_CATECHIST_INSTRUCTIONS ?? DEFAULT_INSTRUCTIONS;

let runtimePromise = null;

const loadAgentsModule = async () => {
  try {
    return await import('@openai/agents');
  } catch (error) {
    const loadError =
      error instanceof Error ? error : new Error('Failed to load @openai/agents.');
    loadError.code = 'MODULE_NOT_FOUND';
    throw loadError;
  }
};

const getRuntime = async () => {
  if (runtimePromise) {
    return runtimePromise;
  }

  runtimePromise = (async () => {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is missing.');
    }

    if (!VECTOR_STORE_ID) {
      throw new Error('OPENAI_CATECHIST_VECTOR_STORE_ID environment variable is missing.');
    }

    const { Agent, Runner, fileSearchTool } = await loadAgentsModule();

    const fileSearch = fileSearchTool([VECTOR_STORE_ID]);

    const agent = new Agent({
      name: 'Assistente Catequista',
      instructions: INSTRUCTIONS,
      model: MODEL,
      tools: [fileSearch],
      modelSettings: {
        temperature: 1,
        topP: 1,
        maxTokens: 2048,
        store: true,
      },
    });

    const runner = new Runner({
      apiKey: OPENAI_API_KEY,
      traceMetadata: {
        __trace_source__: 'catechist-agent',
        ...(WORKFLOW_ID ? { workflow_id: WORKFLOW_ID } : {}),
      },
    });

    return { agent, runner };
  })();

  return runtimePromise;
};

const toAgentContent = (role, text) => ({
  type: role === 'assistant' ? 'output_text' : 'input_text',
  text,
});

const buildConversationHistory = (history, latestMessage) => {
  const conversation = [];

  if (Array.isArray(history)) {
    for (const entry of history) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const role = entry.role === 'assistant' ? 'assistant' : 'user';
      const rawText =
        typeof entry.text === 'string'
          ? entry.text
          : typeof entry.content === 'string'
            ? entry.content
            : '';

      const text = rawText.trim();

      if (!text) {
        continue;
      }

      conversation.push({
        role,
        content: [toAgentContent(role, text)],
      });
    }
  }

  if (typeof latestMessage === 'string') {
    const trimmed = latestMessage.trim();

    if (trimmed.length > 0) {
      const lastItem = conversation[conversation.length - 1];
      const lastText = lastItem?.content?.[0]?.text;

      if (!lastItem || lastItem.role !== 'user' || lastText !== trimmed) {
        conversation.push({
          role: 'user',
          content: [toAgentContent('user', trimmed)],
        });
      }
    }
  }

  if (conversation.length === 0) {
    throw new Error('Conversation history is empty.');
  }

  return conversation;
};

const runCatechistAgent = async ({ message, history }) => {
  const { agent, runner } = await getRuntime();
  const conversationHistory = buildConversationHistory(history, message);
  const result = await runner.run(agent, conversationHistory);

  const finalOutput =
    typeof result?.finalOutput === 'string'
      ? result.finalOutput
      : typeof result?.output_text === 'string'
        ? result.output_text
        : null;

  const conversationId =
    result?.conversation?.id ??
    result?.conversation_id ??
    result?.response?.conversation_id ??
    null;

  const normalizedResult = {
    ...result,
    conversation_id: conversationId ?? undefined,
    output_text: finalOutput ?? undefined,
    final_output: finalOutput ?? undefined,
  };

  return normalizedResult;
};

module.exports = {
  runCatechistAgent,
  buildConversationHistory,
};
