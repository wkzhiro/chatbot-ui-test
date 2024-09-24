import { updateItemInCosmosDB } from './cosmos';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    if (!data.id) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }
    // Loadしたデータがcreate_dateを持っていなかった場合の追加
    if (!data.create_date) {
      data.create_date = Math.floor(new Date().getTime() / 1000);
      console.log("data.create_date2",data.create_date)
    }

    const savedItem = await updateItemInCosmosDB(data.id, data);
    
    // 保存したデータをクライアントに返す
    res.status(200).json(savedItem);

  } catch (error) {
    console.error("データ保存時のエラー:", error);
    const anyError = error as any;

    res.status(500).json({ message: `Failed to save item to Cosmos DB: ${anyError.message}` });
  }
}