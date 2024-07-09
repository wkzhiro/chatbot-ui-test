import axios from "axios";
import { AuthenticationResult, AccountInfo } from "@azure/msal-node";

interface RequestBody {
    jwt: string;
    account: AccountInfo;
}

const handler = async (req: Request): Promise<Response> => {
    const { jwt, account }: RequestBody = await req.json();

    // トークンの有効期限をチェックする関数
    const isTokenExpired = (token: string) => {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
        // console.log("expiration:",payload.exp * 1000," now:",Date.now())
        return payload.exp * 1000 < Date.now();
    };

    // jwtをリフレッシュするAPIリクエスト
    const refreshJWT = async (account: AccountInfo) => {
        const url = "/api/auth/verify";
        const { data }: { data: AuthenticationResult } = await axios.put(url, {
            account
        });
        const newToken = data.accessToken;
        return newToken;
        };

    try {
        if (isTokenExpired(jwt)) {
            const newToken = await refreshJWT(account);
            return new Response(JSON.stringify({ jwt: newToken }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ jwt:jwt }), { status: 200 });
        }
        } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
        }
        };

export default handler;