import { NextApiRequest, NextApiResponse } from 'next';
import { MsalService } from "../../msal";
import { AccountInfo } from "@azure/msal-node";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const msalService = new MsalService();

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
            console.log("")
            res.status(200).json(result);
        } catch (error) {
            console.error('Error acquiring token:', error);
            res.status(500).json({ error: 'Failed to acquire token' });
        }
    } else if (req.method === 'PUT') {
        try {
            const json = req.body;
            const account = json.account as AccountInfo;
            if (!account) {
                res.status(400).json({ error: 'account is not found' });
                return;
            }

            const result = await msalService.acquireTokenSilent(account);
            res.status(200).json(result);
        } catch (error) {
            try{
                // サイレント取得が失敗した場合のフォールバック
                // console.log("Silent token acquisition failed, falling back to interaction", error);
                // リダイレクトによる再認証を実行
                // return await msalService.acquireTokenRedirect(req);
            } catch (error) {
                // console.error("Unexpected error acquiring token silently:", error);
                res.status(500).json({ error: 'Failed to acquire token silently' });
            }
        }
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}