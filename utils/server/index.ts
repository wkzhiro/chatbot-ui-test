import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, APIM_URL, SUBSCRIPTION_KEY } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    // url = `${OPENAI_API_HOST}/openai/deployments/${model.id}/chat/completions?api-version=${OPENAI_API_VERSION}`;
    url = `${APIM_URL}/deployments/${model.id}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  const requestBody = {
    model: model.id,
    // ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    // ...(OPENAI_API_TYPE === 'azure' && { model: AZURE_DEPLOYMENT_ID }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: true,
  };

  const res = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + key, //jwtを使った認証
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      // ...(OPENAI_API_TYPE === 'openai' && {
      //   Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      // }),
      // ...(OPENAI_API_TYPE === 'azure' && {
      //   'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      // }),
      // ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
      //   'OpenAI-Organization': OPENAI_ORGANIZATION,
      // }),
    },
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  console.log("response_chat",requestBody)


  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              if (json.choices[0].finish_reason != null) {
                controller.close();
                return;
              }
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
