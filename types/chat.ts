import { list } from 'postcss';
import { OpenAIModel } from './openai';
import { List } from 'postcss/lib/list';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  temperature: number;
}

export interface RagBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  temperature: number;
  field:string[];
}

export interface RagBody {
  messages: Message[];
  field:string[];
}

// tokencountを追加
export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
  oid?: string | null;
  display: boolean | null;
  tokencount?: string | null;
  _ts?: number | null;
}
