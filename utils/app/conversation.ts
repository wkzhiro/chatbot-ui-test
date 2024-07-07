import { Conversation } from '@/types/chat';
import { jwtDecode } from "jwt-decode";

// JWTトークンのデコード結果の型を定義
interface DecodedToken {
  oid: string;
  sub: string;
  preferred_username: string;
  // 他のフィールドを必要に応じて追加
}

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
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

  // jwtトークン取得 //
  try {
    const key = localStorage.getItem('jwt');
    // console.log("log", key);
    if (key === null) {
        throw new Error("JWT token is null.");
    }
    // JWTトークンをデコード
    const decodedToken = jwtDecode<DecodedToken>(key);
    // console.log("log", decodedToken);
    // `oid`フィールドを取得
    oid = decodedToken.oid;
    console.log("OID:", oid);
    } catch (error) {
        console.error("Error decoding JWT token:", error);
    }

  // oidを各Conversationに追加（存在しない場合のみ）
  const conversationsWithJwt = conversations.map(conversation => {
    if (!conversation.oid) {
      return {
        ...conversation,
        oid: oid,
      };
    }
    return conversation;
  });

  // JWTトークンを紐づけてconvetsationHistoryに保存
  localStorage.setItem('conversationHistory', JSON.stringify(conversationsWithJwt));
  // console.log("conversationsWithJwt",conversationsWithJwt)
  // localStorage.setItem('conversationHistory', JSON.stringify(conversations));

  // 会話を走らせたときに、update
  const selectedConversationString = localStorage.getItem('selectedConversation');
  if (selectedConversationString) {
    // 文字列をオブジェクトにパース
    const selectedConversation = JSON.parse(selectedConversationString);
    if (selectedConversation && 'id' in selectedConversation) {
        console.log("Selected conversation ID:", selectedConversation.id);
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
        }
        localStorage.setItem('selectedConversation', JSON.stringify(matchingConversation));

        // 結果のログ出力
        console.log("matchingConversation",matchingConversation);
        // update
        let body;
        const controller = new AbortController();
        body = JSON.stringify(matchingConversation);
        console.log("body",body)
        const response = await fetch("/api/updateConversation_cosmos", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        console.log("response",response)

    } else {
        console.log("Selected conversation does not have an 'id' property.");
    }
    } else {
        console.log("No selected conversation found in localStorage.");
    }
};

// export const saveConversations = (conversations: Conversation[]) => {
//   localStorage.setItem('conversationHistory', JSON.stringify(conversations));
// };
