import { NextApiRequest, NextApiResponse } from 'next';
import { MsalService } from '../../msal';

// 認証用のURLを発行する
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const msalService = new MsalService();
        try {
            const { verifier, challenge, state } = await msalService.getCryptoCodeVerifier();
            const redirectURL = await msalService.getAuthCodeUrl(challenge, state);

            res.setHeader('Set-Cookie', `csrfToken=${verifier}`);
            res.status(200).json({ redirect_url: redirectURL });
        } catch (error) {
            console.error('Error generating auth URL:', error);
            res.status(500).json({ error: 'Failed to generate auth URL' });
        }
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}
