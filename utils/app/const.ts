export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = 
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "1");

export const OPENAI_API_TYPE =
  process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-03-15-preview';

export const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION || '';

export const AZURE_DEPLOYMENT_ID =
  process.env.AZURE_DEPLOYMENT_ID || '';

export const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || '';

export const APIM_URL =
  process.env.APIM_URL || '';

export const SUBSCRIPTION_KEY =
  process.env.SUBSCRIPTION_KEY || '';

export const NEXT_PUBLIC_SALT =
  process.env.NEXT_PUBLIC_SALT || '';

export const  RAG_TOKEN_LIMIT: number = 
  Number(process.env.RAG_TOKEN_LIMIT) || 10000;

export const COG_END_POINT=
  process.env.COG_END_POINT || '';

export const INDEX_NAME = 
  process.env.INDEX_NAME || '';

export const COG_API_KEY = 
  process.env.COG_API_KEY || '';

export const RAG_END_POINT = 
  process.env.RAG_END_POINT  || '';

export const COG_TAGS_END_POINT = 
  process.env.COG_TAGS_END_POINT  || '';
  