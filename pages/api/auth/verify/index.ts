import { NextApiRequest, NextApiResponse } from 'next';
import { MsalService } from "../../msal";
import { AccountInfo } from "@azure/msal-node";

// グローバル変数として保持する
let msalService: MsalService;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // インスタンスが未作成の場合のみ初期化
    if (!msalService) {
        msalService = new MsalService();
    }

    if (req.method === 'POST') {    
        try {
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
            res.status(200).json(result);
        } catch (error) {
            console.error('Error acquiring token:', error);
            res.status(500).json({ error: 'Failed to acquire token' });
        }
    } else if (req.method === 'PUT') {
        try {
            const json = req.body;
            const account = json.account as AccountInfo;
            // console.log("verify/account : ",account);
            if (!account) {
                res.status(400).json({ error: 'account is not found' });
                return;
            }
            const result = await msalService.acquireTokenSilent(account);
            console.log("refresh", result);
            
            // const refreshToken = msalService.getRefreshToken();
            // console.log("RefreshToken :", refreshToken);
            // if (!refreshToken) {
            //     res.status(400).json({ error: 'refreshToken is not found' });
            //     return;
            // }
            // const result = await msalService.acquireTokenByRefreshToken(refreshToken);
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