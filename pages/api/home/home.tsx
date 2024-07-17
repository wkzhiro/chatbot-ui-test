import { useEffect, useRef, useState,useCallback } from 'react';
import { useQuery } from 'react-query';
import { AuthenticationResult,AccountInfo } from "@azure/msal-node";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE} from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getSettings } from '@/utils/app/settings';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';
import { jwtDecode } from "jwt-decode";

import { v4 as uuidv4 } from 'uuid';
import { isTokenExpired, refreshJWTbytoken } from '../auth/token/tokencheck';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
}

// JWTトークンのデコード結果の型を定義
interface DecodedToken {
  oid: string;
  sub: string;
  preferred_username: string;
  // 他のフィールドを必要に応じて追加
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
      jwt,  // JWTの状態を取得
      oid
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  // jsonかどうかを判定する
  const isValidJson = (str: any) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const fetchData = async () => {
    let oid: string | null = null;
    try {
      const key = localStorage.getItem('jwt');

      // JWTがあるかどうかで判断する
      if (key !== undefined && key !== null) {
        // JWTトークンをデコード
        const decodedToken = jwtDecode<DecodedToken>(key);
        // `oid`フィールドを取得
        oid = decodedToken.oid;
        const response = await fetch('/api/readallconversation_cosmos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oid: oid }),
        });
      
        if (!response.ok) {
          throw new Error('Failed to fetch data from server');
        }
        const conversationHistory = await response.json(); // APIから取得したデータ
        const cleanedConversationHistory = cleanConversationHistory(conversationHistory);
        dispatch({ field: 'conversations', value: cleanedConversationHistory }); // 取得したデータを状態に設定
      }
      
      // selectedConversationからidを抽出し,上書きしたい //
      const selectedConversationString = localStorage.getItem('selectedConversation');
      
  } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const setJWT = (jwt: string) => {
    dispatch({ field: 'jwt', value: jwt });
    localStorage.setItem('jwt', jwt);
  };

    // );

  const setRT = (oid: string) => {
    const crypto = require('crypto');
    const password = process.env.NEXT_PUBLIC_SALT as string;
    console.log("password:",password);
    const algorithm = 'aes-256-cbc';
    
    const cipher = crypto.createCipher(algorithm, password);
    const crypted = cipher.update(oid, 'utf-8', 'hex'); 
    const crypted_text = crypted + cipher.final('hex');
    dispatch({ field: 'oid', value: crypted_text });
    localStorage.setItem('oid', crypted_text);
  };

  // jwtの認証のためのコード
  const params = useSearchParams();
  const [code, _] = useState(params.get("code"));

  useEffect(() => {
    const storedJwt = localStorage.getItem('jwt');

    const handleJWTVerification = async () => {
      // jwtが期限切れの有無に関わらず、ローカルストレージにjwtがある場合、jwtを更新
      if (storedJwt) {
        const storedoid = localStorage.getItem('oid');
        if (storedoid) {
          const newJwt = await refreshJWTbytoken(storedoid);
          setJWT(newJwt);
        } else {
          console.error('OID is missing in local storage.');
        }
      // ローカルストレージにjwtがない場合、認証してjwtを発行し、jwtとoidをローカルストレージに登録
      } else {
        console.log("code_models")
        try {
          const { data } = await axios.post('/api/auth/verify', { code });
          const newJwt = data.result.accessToken;
          const oid = data.oid;
          setJWT(newJwt);
          if (oid) {
            setRT(oid);
          } else {
            console.error('oid information is missing in the response.');
          }
        } catch (error) {
          console.error('Error verifying access token with code:', error);
        }
      }
    };

    handleJWTVerification().then(()=>{
      fetchData()})
  }, [code]);

  const fetchModels = async (signal?: AbortSignal) => {
    let token = jwt;
    console.log("fetchmodel_start");
    if (jwt && isTokenExpired(jwt)) {
      console.log("TokenExpired");
      const storedoid = localStorage.getItem('oid');
      if (storedoid) {
        console.log("put_start");
        token = await refreshJWTbytoken(storedoid);
        setJWT(token);
      }
    }
  
    if (!token) return null;
  
    return getModels(
      {
        key: token,
      },
      signal,
    );
  };

  const { data, error, refetch } = useQuery(['GetModels', jwt], ({ signal }) => fetchModels(signal), {
    enabled: !!jwt,
    refetchOnMount: false,
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の再フェッチを無効化

  });

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    dispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: 'folders', value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };
    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    const apiKey = localStorage.getItem('apiKey');
    // const apiKey = process.env.OPENAI_API_KEY;

    if (serverSideApiKeyIsSet) {
      dispatch({ field: 'apiKey', value: '' });

      localStorage.removeItem('apiKey');
    } else if (apiKey) {
      dispatch({ field: 'apiKey', value: apiKey });
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      dispatch({ field: 'pluginKeys', value: pluginKeys });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem('prompts');
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) });
    }

    // fetchData関数の呼び出し
    fetchData();

    // localstorageから「選択したActive会話」の情報を取得
    const selectedConversation = localStorage.getItem('selectedConversation');
    console.log("selectedConversation",selectedConversation)

    if (selectedConversation && isValidJson(selectedConversation)) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      });
    } else {
      const lastConversation = conversations[conversations.length - 1];
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });
    }
  }, [
    defaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
        setJWT,  // setJWT関数を提供
      }}
    >
      <Head>
        <title>Tech0 Bot by skk</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>

            <Promptbar />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};