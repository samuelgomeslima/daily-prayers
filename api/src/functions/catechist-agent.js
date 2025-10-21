const { app } = require('@azure/functions');
const { Agent, Runner, fileSearchTool } = require('@openai/agents');

const WORKFLOW_ID = process.env.OPENAI_CATECHIST_AGENT_ID ?? null;
const FILE_SEARCH_TOOL = process.env.FILE_SEARCH_TOOL ?? null;

const configuredFileSearchTools = [];

if (FILE_SEARCH_TOOL) {
  configuredFileSearchTools.push(FILE_SEARCH_TOOL);
}

const fileSearch =
  configuredFileSearchTools.length > 0
    ? fileSearchTool(configuredFileSearchTools)
    : null;

const myAgent = new Agent({
  name: 'My agent',
  instructions: `Você é um agente de estudos católicos que responde EXCLUSIVAMENTE com base nos livros “A Fé Explicada”, de Leo J. Trese; “Teologia do Corpo”, de São João Paulo II; “História de uma alma”, de Santa Teresinha; e “Os 4 Temperamentos no Amor”, de Ruth Gomes e Luis Gomes.

Regras:
- Use os arquivos de conhecimento (PDF) para encontrar respostas diretas dos livros.
- Não use fontes externas nem opinião pessoal.
- Responda em português, com clareza e fidelidade ao texto.
- Sempre que possível, cite o capítulo, título ou página aproximada (se detectável).
- Se a pergunta não estiver respondida no livro, diga:  
  “Não encontrei uma resposta direta para isso em 'A Fé Explicada', em 'Teologia do Corpo', em 'História de uma alma' ou em 'Os 4 Temperamentos no Amor'.”

Formato de resposta:
1️⃣ **Resumo claro** (máx. 10 linhas).
2️⃣ **Trecho relevante do livro** entre aspas.
3️⃣ **Referência** (capítulo/página se disponível).

Exemplo:
---
**Pergunta:** O que é fé?

**Resposta:**
A fé é a aceitação racional da verdade revelada por Deus.  
> “A fé é uma luz que ilumina a mente e move a vontade a aceitar o que Deus revelou.”  
📖 *Capítulo 1 – A Fé, página 12.*
---`,
  model: 'gpt-4o-mini',
  tools: fileSearch ? [fileSearch] : [],
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true,
  },
});

const runWorkflow = async (workflow) => {
  if (!workflow || typeof workflow.input_as_text !== 'string') {
    throw new Error('workflow.input_as_text must be a string.');
  }

  const inputText = workflow.input_as_text.trim();

  if (!inputText) {
    throw new Error('workflow.input_as_text must not be empty.');
  }

  const providedConversationId =
    typeof workflow.conversationId === 'string' &&
    workflow.conversationId.trim().length > 0
      ? workflow.conversationId.trim()
      : null;

  const conversationHistory = [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: inputText,
        },
      ],
    },
  ];

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: 'agent-builder',
      workflow_id: WORKFLOW_ID,
    },
  });

  const runOptions = providedConversationId
    ? { conversationId: providedConversationId }
    : undefined;

  const agentResult = runOptions
    ? await runner.run(myAgent, [...conversationHistory], runOptions)
    : await runner.run(myAgent, [...conversationHistory]);

  if (agentResult?.newItems?.length) {
    conversationHistory.push(
      ...agentResult.newItems.map((item) => item.rawItem)
    );
  }

  if (!agentResult?.finalOutput) {
    throw new Error('Agent result is undefined');
  }

  const extractConversationId = () => {
    const directId =
      agentResult?.conversationId ??
      agentResult?.conversation_id ??
      agentResult?.sessionId ??
      agentResult?.session_id ??
      null;

    const nestedId =
      agentResult?.conversation?.id ??
      agentResult?.session?.id ??
      agentResult?.response?.conversation?.id ??
      agentResult?.response?.conversation_id ??
      null;

    return directId || nestedId || providedConversationId || null;
  };

  const conversationId = extractConversationId();

  const responsePayload = {
    output_text: agentResult.finalOutput ?? '',
  };

  if (conversationId) {
    responsePayload.conversation = { id: conversationId };
    responsePayload.conversation_id = conversationId;
  }

  return responsePayload;
};

app.http('catechistAgent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catechist-agent',
  handler: async (request, context) => {
    let body;

    try {
      body = await request.json();
    } catch (error) {
      context.warn('Failed to parse request body as JSON.', error);
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'Invalid JSON payload in request body.',
          },
        },
      };
    }

    const { input_as_text, message, conversationId } = body ?? {};

    const inputText =
      typeof input_as_text === 'string' && input_as_text.trim().length > 0
        ? input_as_text
        : typeof message === 'string'
        ? message
        : null;

    if (!inputText) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message:
              'The request body must include a non-empty "input_as_text" string.',
          },
        },
      };
    }

    try {
      const normalizedConversationId =
        typeof conversationId === 'string' && conversationId.trim().length > 0
          ? conversationId.trim()
          : null;

      const result = await runWorkflow({
        input_as_text: inputText,
        conversationId: normalizedConversationId ?? undefined,
      });
      return {
        status: 200,
        jsonBody: result,
      };
    } catch (error) {
      context.error(
        'Unexpected error when executing catechist agent workflow.',
        error
      );
      return {
        status: 500,
        jsonBody: {
          error: {
            message:
              'Unable to contact the catechist agent right now. Please try again later.',
          },
        },
      };
    }
  },
});

module.exports = {
  runWorkflow,
};
