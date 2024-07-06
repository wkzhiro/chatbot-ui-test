import { NextApiRequest, NextApiResponse } from 'next';
import { MsalService } from "../../msal"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const msalService = new MsalService();
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
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}