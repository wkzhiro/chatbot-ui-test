import { useCallback, useContext, useEffect, useMemo } from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

//import { updateItemInCosmosDB } from '@/pages/api/cosmos'; // このインポートを追加

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { exportData, importData } from '@/utils/app/importExport';
import {  cleanConversationHistory } from '@/utils/app/clean';

import { Conversation } from '@/types/chat';
import { LatestExportFormat, SupportedExportFormats } from '@/types/export';
import { OpenAIModels } from '@/types/openai';
import { PluginKey } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import { ChatFolders } from './components/ChatFolders';
import { ChatbarSettings } from './components/ChatbarSettings';
import { Conversations } from './components/Conversations';

import Sidebar from '../Sidebar';
import ChatbarContext from './Chatbar.context';
import { ChatbarInitialState, initialState } from './Chatbar.state';

import { v4 as uuidv4 } from 'uuid';
import { jwtDecode } from "jwt-decode";

export const Chatbar = () => {
  const { t } = useTranslation('sidebar');

  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  });

  const {
    state: { conversations, showChatbar, defaultModelId, folders, pluginKeys },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleNewConversation,
    handleUpdateConversation,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  // 会話を_tsに基づいて並び替える
  const sortedConversations = useMemo(() => {
    console.log('Sorting conversations:', conversations); // デバッグ用
    return [...conversations].sort((a, b) => {
      const tsA = a._ts || 0;
      const tsB = b._ts || 0;
      return tsA - tsB; // 降順（新しい順）に並び替え
    });
  }, [conversations]);

  useEffect(() => {
    console.log('Sorted conversations:', sortedConversations); // デバッグ用
  }, [sortedConversations]);
  // トークンカウントの更新
  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: 'apiKey', value: apiKey });

      localStorage.setItem('apiKey', apiKey);
    },
    [homeDispatch],
  );

  const handlePluginKeyChange = (pluginKey: PluginKey) => {
    if (pluginKeys.some((key) => key.pluginId === pluginKey.pluginId)) {
      const updatedPluginKeys = pluginKeys.map((key) => {
        if (key.pluginId === pluginKey.pluginId) {
          return pluginKey;
        }

        return key;
      });

      homeDispatch({ field: 'pluginKeys', value: updatedPluginKeys });

      localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys));
    } else {
      homeDispatch({ field: 'pluginKeys', value: [...pluginKeys, pluginKey] });

      localStorage.setItem(
        'pluginKeys',
        JSON.stringify([...pluginKeys, pluginKey]),
      );
    }
  };

  const handleClearPluginKey = (pluginKey: PluginKey) => {
    const updatedPluginKeys = pluginKeys.filter(
      (key) => key.pluginId !== pluginKey.pluginId,
    );

    if (updatedPluginKeys.length === 0) {
      homeDispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
      return;
    }

    homeDispatch({ field: 'pluginKeys', value: updatedPluginKeys });

    localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys));
  };

  const handleExportData = () => {
    exportData();
  };

  const handleImportConversations = (data: SupportedExportFormats) => {
    const { history, folders, prompts }: LatestExportFormat = importData(data);
    homeDispatch({ field: 'conversations', value: history });
    homeDispatch({
      field: 'selectedConversation',
      value: history[history.length - 1],
    });
    homeDispatch({ field: 'folders', value: folders });
    homeDispatch({ field: 'prompts', value: prompts });

    window.location.reload();
  };

  const handleClearConversations = () => {
    defaultModelId &&
      homeDispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });

    homeDispatch({ field: 'conversations', value: [] });

    localStorage.removeItem('conversationHistory');
    localStorage.removeItem('selectedConversation');

    const updatedFolders = folders.filter((f) => f.type !== 'chat');

    homeDispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };


  const handleDeleteConversation = async (conversation: Conversation) => {
    const updatedConversations = conversations.map((c) => {
      if (c.id === conversation.id) {
        return { ...c, display: false };
      }
      return c;
    });
  
    homeDispatch({ field: 'conversations', value: updatedConversations });
    chatDispatch({ field: 'searchTerm', value: '' });
    saveConversations(updatedConversations);
  
    // APIを介してCosmosDBを更新
    try {
      const response = await fetch('/api/updateConversation_cosmos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...conversation, display: false }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update conversation in Cosmos DB');
      }
    } catch (error) {
      console.error('Failed to update conversation in Cosmos DB:', error);
      // エラーハンドリングをここに追加（例：ユーザーに通知するなど）
    }
  
    if (updatedConversations.filter(c => c.display !== false).length > 0) {
      const lastVisibleConversation = updatedConversations.filter(c => c.display !== false).pop();
      if (lastVisibleConversation) {
        homeDispatch({
          field: 'selectedConversation',
          value: lastVisibleConversation,
        });
        saveConversation(lastVisibleConversation);
      }
    } else {
      defaultModelId &&
        homeDispatch({
          field: 'selectedConversation',
          value: {
            id: uuidv4(),
            name: t('New Conversation'),
            messages: [],
            model: OpenAIModels[defaultModelId],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            folderId: null,
            display: true,
          },
        });
  
      localStorage.removeItem('selectedConversation');
    }
  };

  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showChatbar', value: !showChatbar });
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar));
  };

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
      handleUpdateConversation(conversation, { key: 'folderId', value: 0 });
      chatDispatch({ field: 'searchTerm', value: '' });
      e.target.style.background = 'none';
    }
  };

useEffect(() => {
  const visibleConversations = sortedConversations.filter(c => c.display !== false);
  if (searchTerm) {
    chatDispatch({
      field: 'filteredConversations',
      value: visibleConversations.filter((conversation) => {
        const searchable =
          conversation.name.toLocaleLowerCase() +
          ' ' +
          conversation.messages.map((message) => message.content).join(' ');
        return searchable.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    });
  } else {
    chatDispatch({
      field: 'filteredConversations',
      value: visibleConversations,
    });
  }
}, [searchTerm, sortedConversations]); // conversationsをsortedConversationsに変更

return (
  <ChatbarContext.Provider
    value={{
      ...chatBarContextValue,
      handleDeleteConversation,
      handleClearConversations,
      handleImportConversations,
      handleExportData,
      handlePluginKeyChange,
      handleClearPluginKey,
      handleApiKeyChange,
    }}
  >
    <Sidebar<Conversation>
      side={'left'}
      isOpen={showChatbar}
      addItemButtonTitle={t('New chat')}
      itemComponent={<Conversations conversations={filteredConversations} />}
      folderComponent={<ChatFolders searchTerm={searchTerm} />}
      items={filteredConversations}
      searchTerm={searchTerm}
      handleSearchTerm={(searchTerm: string) =>
        chatDispatch({ field: 'searchTerm', value: searchTerm })
      }
      toggleOpen={handleToggleChatbar}
      handleCreateItem={handleNewConversation}
      handleCreateFolder={() => handleCreateFolder(t('New folder'), 'chat')}
      handleDrop={handleDrop}
      footerComponent={<ChatbarSettings />}
    />
  </ChatbarContext.Provider>
  );
};