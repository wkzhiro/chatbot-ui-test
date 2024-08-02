import { RAG_TOKEN_LIMIT,RAG_END_POINT} from '@/utils/app/const';
import { OpenAIError } from '@/utils/server';

import { RagBody, Message } from '@/types/chat';
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
        const { messages, field } = (await req.json()) as RagBody;

        await init((imports) => WebAssembly.instantiate(wasm, imports));
        const encoding = new Tiktoken(
            tiktokenModel.bpe_ranks,
            tiktokenModel.special_tokens,
            tiktokenModel.pat_str,
        );

        // let promptToSend = prompt;
        // if (!promptToSend) {
        //     promptToSend = DEFAULT_SYSTEM_PROMPT;
        // }

        // let temperatureToUse = temperature;
        // if (temperatureToUse == null) {
        //     temperatureToUse = DEFAULT_TEMPERATURE;
        // }

        // // システムプロンプトのTokenカウント
        // const prompt_tokens = encoding.encode(promptToSend);

        let tokenCount = 0;
        let savetokenCount = 0;
        let messagesToSend: Message[] = [];

        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            const tokens = encoding.encode(message.content);

            if (tokenCount + tokens.length + 1000 > RAG_TOKEN_LIMIT) {
                break;
            }
            tokenCount += tokens.length;
            messagesToSend = [message, ...messagesToSend];

            // 消費token数をDBに保存する用
            savetokenCount += tokens.length;
        }

        const response = await fetch(
            RAG_END_POINT, 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "filed": field,
                    "message": messagesToSend
                })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Azure function');
        }

        const result = await response.json();

        encoding.free();

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("X-Token-Count", tokenCount.toString());

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: headers
        });
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
