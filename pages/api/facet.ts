
import { COG_END_POINT, INDEX_NAME, COG_API_KEY} from '@/utils/app/const';

import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { NextApiRequest, NextApiResponse } from 'next';

const searchClient = new SearchClient(
    COG_END_POINT,
    INDEX_NAME,
    new AzureKeyCredential(COG_API_KEY)
);

const handler = async (res: NextApiResponse) => {
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
        res.status(500).json({ error: "Error retrieving facets" });
    }
};

export default handler;