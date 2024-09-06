import { Conversation, DecodedToken } from '@/types/chat';
import { jwtDecode } from "jwt-decode";

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  
  // displayプロパティがnullの場合、trueに設定
  if (updatedConversation.display === null) {
    updatedConversation.display = true;
  }

  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation;
    }

    return c;
  });

  saveConversation(updatedConversation);
  saveConversations(updatedConversations);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};

export const saveConversation = (conversation: Conversation) => {
  localStorage.setItem('selectedConversation', JSON.stringify(conversation));
};

// すべての会話データをローカルストレージに保存する関数
export const saveConversations = async(conversations: Conversation[]) => {
  let oid: string | null = null;
  let groups: string[] | null = null;

  // jwtトークン取得 //
  try {
    const key = localStorage.getItem('jwt');
    // // console.log("log", key);
    if (key === null) {
        throw new Error("JWT token is null.");
    }
    // JWTトークンをデコード
    const decodedToken = jwtDecode<DecodedToken>(key);
    // `oid`フィールドを取得
    oid = decodedToken.oid;

    // `groups`フィールドを取得
    if (decodedToken.groups) {
      groups = decodedToken.groups;
      console.log("Groups:", groups);
    } else {
      console.log("Groups not found in token.");
    }
    // console.log("OID:", oid);
    } catch (error) {
        console.error("Error decoding JWT token:", error);
    }

  // oidを各Conversationに追加（存在しない場合のみ）、groupsを常に追加し存在しない場合は空の配列を設定
  // const conversationsWithJwt = conversations.map(conversation => {
  //   if (!conversation.oid) {
  //     return {
  //       ...conversation,
  //       oid: oid,
  //     };
  //   }
  //   return conversation;
  // });
  const conversationsWithJwt = conversations.map(conversation => {
    return {
      ...conversation,
      oid: conversation.oid || oid,  // `oid` が存在しない場合のみ `oid` を設定
      groups: groups || [],          // `groups` を常に追加し、存在しない場合は空の配列を設定
    };
  });

  // JWTトークンを紐づけてconvetsationHistoryに保存
  localStorage.setItem('conversationHistory', JSON.stringify(conversationsWithJwt));
  // // console.log("conversationsWithJwt",conversationsWithJwt)
  // localStorage.setItem('conversationHistory', JSON.stringify(conversations));

  // 会話を走らせたときに、update
  const selectedConversationString = localStorage.getItem('selectedConversation');
  console.log("selectedConversationString",selectedConversationString)

  if (selectedConversationString) {
    // 文字列をオブジェクトにパース
    const selectedConversation = JSON.parse(selectedConversationString);
    if (selectedConversation && 'id' in selectedConversation) {
        // console.log("Selected conversation ID:", selectedConversation.id);
        // 特定のIDを検索
        const targetId = selectedConversation.id;

        // 特定のIDに一致するオブジェクトをフィルタリング
        const matchingConversation = conversations.find(conversation => conversation.id === targetId);

        // oid追加
        if (matchingConversation) {
          // matchingConversationがoidを持っていなければ追加
          if (!matchingConversation.oid) {
            matchingConversation.oid = oid;
          }
          // groups が存在しなければ追加
          if (!matchingConversation.groups) {
            matchingConversation.groups = groups || [];
          }
          if (!matchingConversation.create_date) {
            matchingConversation.create_date = new Date().toISOString();  // 現在の日時を ISO 形式で追加
          }
        }
        localStorage.setItem('selectedConversation', JSON.stringify(matchingConversation));

        let body;
        const controller = new AbortController();
        body = JSON.stringify(matchingConversation);
        console.log("matchingConversation",matchingConversation)
        const response = await fetch("/api/updateConversation_cosmos", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        // console.log("response",response)

    } else {
        // console.log("Selected conversation does not have an 'id' property.");
    }
    } else {
        // console.log("No selected conversation found in localStorage.");
    }
};

// export const saveConversations = (conversations: Conversation[]) => {
//   localStorage.setItem('conversationHistory', JSON.stringify(conversations));
// };