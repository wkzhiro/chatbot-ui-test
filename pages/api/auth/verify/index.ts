import { NextApiRequest, NextApiResponse } from 'next';
import { MsalService } from "../../msal";
import { AccountInfo } from "@azure/msal-node";
import { readrefreshtokenFromCosmosDB } from '../../cosmos';
import { updateToken } from '../../cosmos';
import { v4 as uuidv4 } from 'uuid';

// グローバル変数として保持する
let msalService: MsalService;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // インスタンスが未作成の場合のみ初期化
    if (!msalService) {
        msalService = new MsalService();
    }

    if (req.method === 'POST') {    
        try {
            console.log("POST")
            const json = req.body;
            const code = json.code as string;
            if (!code) {
                res.status(400).json({ error: 'code is not found' });
                return;
            }

            const verifier = req.cookies['csrfToken'];
            if (!verifier) {
                res.status(400).json({ error: 'invalid request' });
                return;
            }
            const result = await msalService.acquireTokenByCode(code, verifier);

            const refreshToken = msalService.getRefreshToken();
            console.log("RefreshToken :", refreshToken);
            if (!refreshToken) {
                res.status(400).json({ error: 'refreshToken is not found' });
                return;
            }
            
            // oid取得
            let oid: string | null = null;
            let uuid: string | null = uuidv4();
            oid = result.account?.idTokenClaims?.oid ?? null; // undefinedの場合にnullを設定

            console.log("verify_oid",oid)

            // oidがnullでない場合のみupdateTokenを呼び出す
            if (oid) {
                console.log("start:updateRefreshToken");
                await updateToken(oid, refreshToken, uuid);
                console.log("end:updateRefreshToken");
            } else {
                console.log('oid is null or undefined');
            };
            res.status(200).json({ result: result, oid: oid});
            // const result = await msalService.acquireTokenByRefreshToken(refreshToken);
        } catch (error) {
            console.error('Error acquiring token:', error);
            res.status(500).json({ error: 'Failed to acquire token' });
        }
    } else if (req.method === 'PUT') {
        try {
            const json = req.body;
            // const account = json.account as AccountInfo;
            const cipher_oid = json.oid as string
            // console.log("verify/account : ",account);
            // if (!account) {
            //     res.status(400).json({ error: 'account is not found' });
            //     return;
            // }
            // const result = await msalService.acquireTokenSilent(account);
            
            const crypto = require('crypto');
            console.log("cipher_oid", cipher_oid)
            const password = process.env.NEXT_PUBLIC_SALT as string;
            console.log("password_veryfy:",password);
            const decipher = crypto.createDecipher('aes-256-cbc',password );
            const decrypted = decipher.update(cipher_oid, 'hex', 'utf-8');
            const decrypted_text = decrypted + decipher.final('utf8');
            // const decrypted_text = decipher.final('utf-8');
            console.log("decrypted_text", decrypted_text);
            const refreshtoken  = await readrefreshtokenFromCosmosDB('"'+decrypted_text.toString()+'"');
            console.log("refreshtoken", refreshtoken);
            const result = await msalService.acquireTokenByRefreshToken(refreshtoken);
            console.log("refresh_verify", result);
            
            res.status(200).json(result);
        } catch (error) {
            try {
                console.log("Silent token acquisition failed, falling back to interaction", error);
            } catch (error) {
                console.error("Unexpected error acquiring token silently:", error);
                res.status(500).json({ error: 'Failed to acquire token silently' });
            }
        }
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}