import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { saveToCosmosDB } from './cosmos'; // インポートを追加
import { jwtDecode } from "jwt-decode";

import { ChatBody, Message } from '@/types/chat';
// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

export const config = {
  runtime: 'edge',
};

// JWTトークンのデコード結果の型を定義
interface DecodedToken {
    oid: string;
    sub: string;
    preferred_username: string;
    // 他のフィールドを必要に応じて追加
  }


const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, key, prompt, temperature } = (await req.json()) as ChatBody;
    // console.log("log", key)
    //   // JWTトークンをデコード
    //   const decodedToken = jwtDecode<DecodedToken>(key);
    //   console.log("log", decodedToken)
    //   // `oid`フィールドを取得
    //   const oid = decodedToken.oid;
    //   // console.log("OID:", oid);
    //   // console.log("OID:", oid);
    
    //  try {
    //  } catch (error) {
    //   console.error("Error decoding JWT token:", error);
    //  }

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, key, messagesToSend);

    // Create a TransformStream to tap into the stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let responseText = '';
    
    (async () => {
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          responseText += decoder.decode(value, { stream: !done });
          writer.write(value);
        }
      }
      writer.close();

      const response_tokens = encoding.encode(responseText);
      const responseTokenCount = response_tokens.length;

      //// test : Save to Cosmos DB
      // const item = {
      //  userid:oid,
      //   userId: 1,
      //   id: `chat-${Date.now()}`, // 任意の一意なIDを生成
      //   promptTokenCount: tokenCount,
      //   responseTokenCount: responseTokenCount,
      //   timestamp: new Date().toISOString()
      // };

      // await saveToCosmosDB(item);

      encoding.free();
    })();

    return new Response(readable);
  } catch (error) {
    const anyError = error as any; // errorをany型にキャスト
    console.error(anyError);
    if (anyError instanceof OpenAIError) {
      return new Response(JSON.stringify({ error: anyError.message }), { status: 500 });
    } else {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
  }
};

export default handler;