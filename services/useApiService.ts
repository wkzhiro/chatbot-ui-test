import { useCallback } from 'react';
import { useFetch } from '@/hooks/useFetch';

import axios from "axios";
import { AuthenticationResult, AccountInfo } from "@azure/msal-node";

export interface GetModelsRequestProps {
  key: string;
}

export interface RequestBody {
    jwt: string;
    account: AccountInfo;
}

const useApiService = () => {
  const fetchService = useFetch();

  // const getModels = useCallback(
  // 	(
  // 		params: GetManagementRoutineInstanceDetailedParams,
  // 		signal?: AbortSignal
  // 	) => {
  // 		return fetchService.get<GetManagementRoutineInstanceDetailed>(
  // 			`/v1/ManagementRoutines/${params.managementRoutineId}/instances/${params.instanceId
  // 			}?sensorGroupIds=${params.sensorGroupId ?? ''}`,
  // 			{
  // 				signal,
  // 			}
  // 		);
  // 	},
  // 	[fetchService]
  // );

  const getModels = useCallback(
    (params: GetModelsRequestProps, signal?: AbortSignal) => {
      return fetchService.post<GetModelsRequestProps>(`/api/models`, {
        body: { key: params.key },
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  const checkToken = async (jwt: string, account: AccountInfo): Promise<string | null> => {
    // トークンの有効期限をチェックする関数
    const isTokenExpired = (token: string) => {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
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
        console.log("refresh",newToken, account)
        return newToken;
      } else {
        return jwt;
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return null;
    }
  };


  return {
    getModels,checkToken
  };
};

export default useApiService;
