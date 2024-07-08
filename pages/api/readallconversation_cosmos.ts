import { readAllItemsFromCosmosDB } from './cosmos'; // インポートを追加
import { jwtDecode } from "jwt-decode";

import type { NextApiRequest, NextApiResponse } from 'next';

// JWTトークンのデコード結果の型を定義
interface DecodedToken {
  oid: string;
  sub: string;
  preferred_username: string;
  // 他のフィールドを必要に応じて追加
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // jwtトークンを取得
  let oid: string | null = null;
  try {
      const key = localStorage.getItem('jwt');
      if (key === null) {
          throw new Error("JWT token is null.");
      }
      // JWTトークンをデコード
      const decodedToken = jwtDecode<DecodedToken>(key);
      // console.log("log", decodedToken);
      // `oid`フィールドを取得
      oid = decodedToken.oid;
      console.log("readall_OID:", oid);
  } catch (error) {
          console.error("Error decoding JWT token:", error);
      }
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