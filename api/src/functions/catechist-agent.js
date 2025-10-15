const { app } = require('@azure/functions');
const { Agent, Runner, fileSearchTool } = require('@openai/agents');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKFLOW_ID = process.env.OPENAI_CATECHIST_AGENT_ID ?? null;
const FILE_SEARCH_TOOL = process.env.FILE_SEARCH_TOOL ?? null;

const tools = [];

if (FILE_SEARCH_TOOL) {
  tools.push(
    fileSearchTool([
      FILE_SEARCH_TOOL,
    ]),
  );
}

const myAgent = new Agent({
  name: 'My agent',
  instructions: `Você é um agente de estudos católicos que responde EXCLUSIVAMENTE com base no livro “A Fé Explicada”, de Leo J. Trese.

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
---`,
  model: 'gpt-4o-mini',
  tools,
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true,
  },
});

const runWorkflow = async (workflow) => {
  const { input_as_text: inputText } = workflow ?? {};

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

  const traceMetadata = {
    __trace_source__: 'agent-builder',
  };

  if (WORKFLOW_ID) {
    traceMetadata.workflow_id = WORKFLOW_ID;
  }

  const runner = new Runner({
    traceMetadata,
  });
  const agentResult = await runner.run(myAgent, [...conversationHistory]);

  if (!agentResult.finalOutput) {
    throw new Error('Agent result is undefined');
  }

  return {
    output_text: agentResult.finalOutput ?? '',
  };
};

app.http('catechistAgent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'catechist-agent',
  handler: async (request, context) => {
    if (!OPENAI_API_KEY) {
      context.warn('Missing OPENAI_API_KEY environment variable.');
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'The OpenAI API key is not configured on the server.',
          },
        },
      };
    }

    if (!WORKFLOW_ID) {
      context.warn('Missing OPENAI_CATECHIST_AGENT_ID environment variable.');
      return {
        status: 500,
        jsonBody: {
          error: {
            message:
              'The catechist agent identifier is not configured. Define OPENAI_CATECHIST_AGENT_ID in your environment.',
          },
        },
      };
    }

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

    const { message } = body ?? {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      return {
        status: 400,
        jsonBody: {
          error: {
            message: 'The request body must include a non-empty "message" string.',
          },
        },
      };
    }

    try {
      const result = await runWorkflow({
        input_as_text: message.trim(),
      });

      return {
        status: 200,
        jsonBody: result,
      };
    } catch (error) {
      context.error('Unexpected error running catechist agent workflow.', error);
      return {
        status: 500,
        jsonBody: {
          error: {
            message: 'Unable to contact the catechist agent right now. Please try again later.',
          },
        },
      };
    }
  },
});

module.exports = {
  runWorkflow,
};
