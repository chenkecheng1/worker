import { GraphQLError } from 'graphql';
import { createSchema, createYoga } from 'graphql-yoga';

const callOpenAI = async (prompt, env) => {
  console.log('env',env)
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 未配置（wrangler secret put OPENAI_API_KEY）');

  const baseUrl = (env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  const target = `${baseUrl}/chat/completions`;
  const model = env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const systemPrompt =
    env.SYSTEM_PROMPT ?? '你是一个乐于助人的中文助手，请使用简洁的中文回答。';

  const response = await fetch(target, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI 请求失败：${response.status} - ${text}`);
  }
 
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content ?? '';
};

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      ping: String!
    }

    type Mutation {
      askAI(prompt: String!): String!
    }
  `,
  resolvers: {
    Query: {
      ping: () => 'pong',
    },
    Mutation: {
      askAI: async (_root, args, ctx) => {
        try {
          return await callOpenAI(args.prompt, ctx.env);
        } catch (error) {
          console.error('askAI resolver failed', error);
          throw new GraphQLError(error.message ?? 'OpenAI 调用失败', {
            extensions: {
              code: 'OPENAI_ERROR',
            },
          });
        }
      },
    },
  },
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: {
    origin: '*',
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['content-type'],
  },
  context: ({ request, env, ctx }) => ({
    request,
    env,
    executionCtx: ctx,
  }),
});

export default {
  fetch(request, env, ctx) {
    return yoga.fetch(request, { env, ctx });
  },
};
