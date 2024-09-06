import { readAllItemsFromCosmosDB } from './cosmos'; // インポートを追加
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from '@/types/chat';
import type { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // jwtトークンを取得
  const { oid } = req.body;
  // oidが存在しない場合、エラーレスポンスを返す
  if (!oid) {
    return res.status(400).json({ error: 'OID is required' });
  }

  console.log("Received OID:", oid);

  try {
    console.log("readallitemfromcosmosdb")
    const items = await readAllItemsFromCosmosDB(oid);
      
      // 読み込んだデータをクライアントに返す
      res.status(200).json(items);
    } catch (error) {
      console.error("データ読み込み時のエラー:", error);
      const anyError = error as any; // errorをany型にキャスト
      res.status(500).json({ message: `Failed to fetch items from Cosmos DB: ${anyError.message}` });
    }
  }