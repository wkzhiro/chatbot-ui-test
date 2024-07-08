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
  // // jwtトークンを取得
  // const MAX_RETRIES = 5;
  // const RETRY_INTERVAL_MS = 1000; // 1秒

  // // JWTトークンを取得するための関数
  // async function getJwtToken(): Promise<string> {
  //   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  //     const key = localStorage.getItem('jwt');
  //     if (key !== null && key !== undefined) {
  //       return key;
  //     }
  //     // JWTが取得できない場合は待機
  //     await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
  //   }
  //   throw new Error("JWT token is null or undefined after multiple retries.");
  // }

  let oid: string | null = null;
  try {
    // Cosmos DBから全てのアイテムを読み込む
    console.log("readallitemfromcosmosdb")


    ////////////////
    // try {
    //   const key = await getJwtToken();
    //   // JWTトークンをデコード
    //   const decodedToken = jwtDecode<DecodedToken>(key);
    //   // `oid`フィールドを取得
    //   oid = decodedToken.oid;
    //   console.log("readall_OID:", oid);
    // } catch (error) {
    //   console.error("Error decoding JWT token:", error);
    // }


    // try {
    //   const key = localStorage.getItem('jwt');
    //   // console.log("log", key);
    //   if (key === null) {
    //       throw new Error("JWT token is null.");
    //   }
    //   // JWTトークンをデコード
    //   const decodedToken = jwtDecode<DecodedToken>(key);
    //   // console.log("log", decodedToken);
    //   // `oid`フィールドを取得
    //   oid = decodedToken.oid;
    //   console.log("readall_OID:", oid);
    //   } catch (error) {
    //       console.error("Error decoding JWT token:", error);
    //   }



      const items = await readAllItemsFromCosmosDB();
      
      // 読み込んだデータをクライアントに返す
      res.status(200).json(items);
    } catch (error) {
      console.error("データ読み込み時のエラー:", error);
      const anyError = error as any; // errorをany型にキャスト
      res.status(500).json({ message: `Failed to fetch items from Cosmos DB: ${anyError.message}` });
    }
  }