import { saveToCosmosDB } from './cosmos'; // インポートを追加

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // req.body を直接使用する
    const data = req.body;
    
    // ここでデータベースに保存する処理などを行う
    const savedItem = await saveToCosmosDB(data);
    
    // 保存したデータをクライアントに返す
    res.status(200).json(savedItem);
  } catch (error) {
    console.error("データ保存時のエラー:", error);
    const anyError = error as any;

    res.status(500).json({ message: `Failed to save item to Cosmos DB: ${anyError.message}` });
  }
}
