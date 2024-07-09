import { AuthenticationResult, ConfidentialClientApplication, Configuration, CryptoProvider, LogLevel, SilentFlowRequest, AccountInfo, RefreshTokenRequest  } from "@azure/msal-node";


export class MsalService {
    private _config: Configuration = {
        auth: {
            clientId: process.env.CLIENT_ID ?? "",
            authority: (process.env.CLOUD_INSTANCE ?? "") + (process.env.TENANT_ID ?? ""),
            clientSecret: process.env.CLIENT_SECRET
                },
        system: {
            loggerOptions: {
                piiLoggingEnabled: false,
                logLevel: LogLevel.Info,
            }
        }
    }
    private _msalInstance: ConfidentialClientApplication = new ConfidentialClientApplication(this._config)
    private _msalCryptProvider: CryptoProvider = new CryptoProvider()
    private _REDIRECT_URI: string = process.env.REDIRECT_URI ?? ""
    private _SCOPE: string[] = [(process.env.SCOPE ?? ""), "offline_access", "user.read","openid","profile"];
    // 認証用のコードを発行する
    public getCryptoCodeVerifier = async(): Promise<{verifier: string, challenge: string, state: string}> => {
        const csrfToken = this._msalCryptProvider.createNewGuid()
        const {verifier, challenge} = await this._msalCryptProvider.generatePkceCodes()
        const state = this._msalCryptProvider.base64Encode(
        JSON.stringify({
            csrfToken,
            redirectTo: "/",
        })
        )
        return {verifier, challenge, state}
    }
    // 認証用のURLを発行する
    public getAuthCodeUrl = async(challenge: string, state: string, scopes?: string[]): Promise<string> => {
        const redirectURL = await this._msalInstance.getAuthCodeUrl({
        redirectUri: this._REDIRECT_URI,
        codeChallengeMethod: "S256",
        codeChallenge: challenge,
        responseMode: "query",
        state,
        scopes: scopes ?? this._SCOPE,
        })
        return redirectURL
    }
    // 認証コードを検証し、JWT トークンを取得する
    public acquireTokenByCode = async(code: string, verifier: string, scopes?: string[]): Promise<AuthenticationResult> => {
        return await this._msalInstance.acquireTokenByCode({
        code: code,
        codeVerifier: verifier,
        redirectUri: this._REDIRECT_URI,
        scopes: scopes ?? this._SCOPE,
        })
    }
    // リフレッシュトークンを使用して新しいアクセストークンを取得する
    public acquireTokenSilent = async(account: AccountInfo, scopes?: string[]): Promise<AuthenticationResult> => {
        const silentRequest: SilentFlowRequest = {
            account: account,
            scopes: scopes ?? this._SCOPE,
        };
        return await this._msalInstance.acquireTokenSilent(silentRequest);
    }

    public getRefreshToken = () => {
        const tokenCache = this._msalInstance.getTokenCache().serialize();
        const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
        console.log("tokenCache : ",tokenCache);
        const refreshToken = refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;
        console.log("RefreshToken :",refreshToken);
        return refreshToken;
    };

    // リフレッシュトークンを使用して新しいアクセストークンを取得する
    public acquireTokenByRefreshToken = async(refreshToken: string, scopes?: string[]): Promise<AuthenticationResult> => {
        const refreshTokenRequest: RefreshTokenRequest = {
            refreshToken: refreshToken,
            scopes: scopes ?? this._SCOPE,
        };
        const result = await this._msalInstance.acquireTokenByRefreshToken(refreshTokenRequest);
        if (result) {
            return result;
        }
        throw new Error("Failed to acquire token by refresh token.");
    }
}