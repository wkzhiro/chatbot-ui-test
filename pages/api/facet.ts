
// import { COG_END_POINT, INDEX_NAME, COG_API_KEY} from '@/utils/app/const';

// import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
// import { NextApiRequest, NextApiResponse } from 'next';

// const searchClient = new SearchClient(
//     COG_END_POINT,
//     INDEX_NAME,
//     new AzureKeyCredential(COG_API_KEY)
// );

// const handler = async (req: NextApiRequest, res: NextApiResponse) :Promise<void>=> {
//     const searchText = "*"; // 全文検索
//     const facetField = "tags";

//     try {
//         const results = await searchClient.search(searchText, {
//         facets: [facetField],
//         });

//         const facets = results.facets;

//         // ファセット情報の出力
//         if (facets && facets[facetField]) {
//             const facetValues = facets[facetField].map(facet => facet.value);
//             res.status(200).json({ tags: facetValues });
//         } else {
//         res.status(200).json({ message: "No facets found" });
//         }
//     } catch (error) {
//         console.error("Error retrieving facets:", error);
//         console.log("Response object:", res);  // 追加
//         res.status(500).json({ error: "Error retrieving facets" });
//     }
// };

// export default handler;

import { COG_TAGS_END_POINT } from '@/utils/app/const';

export const config = {
    runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
    try {

        // console.log("req",req)

        const { key } = await req.json();
        
        // console.log("key",key)
        // API ManagementのエンドポイントにGETリクエストを送信
        const response = await fetch(
            COG_TAGS_END_POINT, 
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + key,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        console.log("Response", response)

        const data = await response.json();

        const headers = new Headers();
        headers.append("Content-Type", "application/json");

        // リストの出力
        if (data && data.tags) {
            return new Response(JSON.stringify({ tags: data.tags }), {
                status: 200,
                headers: headers
            });
        } else {
            return new Response(JSON.stringify({ message: "No tags found" }), {
                status: 200,
                headers: headers
            });
        }
    } catch (error) {
        console.error("Error retrieving tags:", error);
        return new Response(JSON.stringify({ error: "Error retrieving tags" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export default handler;