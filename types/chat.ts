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

// groupsを追加
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
  groups?: string[] | null;
  create_date?: string | null;
}

// JWTトークンのデコード結果の型を定義
export interface DecodedToken {
  oid: string;
  sub: string;
  preferred_username: string;
  groups?: string[]; 
  // 他のフィールドを必要に応じて追加
}