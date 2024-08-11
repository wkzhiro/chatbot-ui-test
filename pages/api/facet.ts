
import { COG_END_POINT, INDEX_NAME, COG_API_KEY} from '@/utils/app/const';

import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { NextApiRequest, NextApiResponse } from 'next';

const searchClient = new SearchClient(
    COG_END_POINT,
    INDEX_NAME,
    new AzureKeyCredential(COG_API_KEY)
);

const handler = async (req: NextApiRequest, res: NextApiResponse) :Promise<void>=> {
    const searchText = "*"; // 全文検索
    const facetField = "tags";

    try {
        const results = await searchClient.search(searchText, {
        facets: [facetField],
        });

        const facets = results.facets;

        // ファセット情報の出力
        if (facets && facets[facetField]) {
            const facetValues = facets[facetField].map(facet => facet.value);
            res.status(200).json({ tags: facetValues });
        } else {
        res.status(200).json({ message: "No facets found" });
        }
    } catch (error) {
        console.error("Error retrieving facets:", error);
        console.log("Response object:", res);  // 追加
        res.status(500).json({ error: "Error retrieving facets" });
    }
};

export default handler;

// import { COG_TAGS_END_POINT} from '@/utils/app/const';
// import { NextApiRequest, NextApiResponse } from 'next';

// const handler = async (req: NextApiRequest, res: NextApiResponse) :Promise<void> => {
//     try {
//         // API ManagementのエンドポイントにGETリクエストを送信
//         const response = await fetch(
//             COG_TAGS_END_POINT, 
//             {
//                 method: 'GET',
//                 headers: {
                        // 'Authorization': 'Bearer ' + key,
//                     'Content-Type': 'application/json',
//                 }
//             }
//         );



//         if (!response.ok) {
//             throw new Error(`Failed to fetch: ${response.statusText}`);
//         }

//         const data = await response.json();

//         // リストの出力
//         if (data && data.tags) {
//             res.status(200).json({ tags: data.tags });
//         } else {
//             res.status(200).json({ message: "No tags found" });
//         }
//     } catch (error) {
//         console.error("Error retrieving tags:", error);
//         res.status(500).json({ error: "Error retrieving tags" });
//     }
// };

// export default handler;