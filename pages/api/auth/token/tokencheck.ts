import { AuthenticationResult } from "@azure/msal-node";
import axios from "axios";

// トークンの有効期限をチェックする関数
export  const isTokenExpired = (token: string) => {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
    // console.log("expiration:",payload.exp * 1000," now:",Date.now())
    const issuedAt = payload.iat * 1000; // iatは秒単位なのでミリ秒に変換
    const ninetySeconds = 3600 * 1000; // 90秒をミリ秒に変換
    return Date.now() > (issuedAt + ninetySeconds);
    // return payload.exp * 1000 < Date.now();
    };


// jwtをリフレッシュするAPIリクエスト
export  const refreshJWTbytoken = async (oid: string) => {
  const url = "/api/auth/verify";
  const { data }: { data: AuthenticationResult } = await axios.put(url, {
    oid:oid
  });
  // console.log("refresh_oid_received", oid)
  const newToken = data.accessToken;
  return newToken;
};
