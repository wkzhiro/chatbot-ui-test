const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DB_ID;
const containerId = process.env.COSMOS_CON_ID;

// export const saveToCosmosDB = async (item: any) => {
//     const container = client.database(databaseId).container(containerId);
//     try {
//         const { resource: createdItem } = await container.items.create(item);
//         console.log(`Item created:\n${JSON.stringify(createdItem, null, 2)}`);
//         return createdItem;
//     } catch (error) {
//         const anyError = error as any; // errorをany型にキャスト
//         console.error(`Error creating item: ${anyError.message}`);
//         throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
//     }
// };


export const saveToCosmosDB = async (item: any) => {
    const container = client.database(databaseId).container(containerId);
    try {
        // itemが文字列の場合、オブジェクトに変換
        const { resource: createdItem } = await container.items.create(item);
        console.log(`Item created:\n${JSON.stringify(createdItem, null, 2)}`);
        return createdItem;
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error creating item: ${anyError.message}`);
        throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
    }
};

// read
export const readAllItemsFromCosmosDB = async () => {
    const container = client.database(databaseId).container(containerId);
    try {
        // 全てのアイテムを取得するクエリ
        const query = `SELECT * FROM c`;
        const { resources: items } = await container.items.query(query).fetchAll();
        if (items.length > 0) {
            // console.log(`Items found:\n${JSON.stringify(items, null, 2)}`);
            return items;
        } else {
            console.log('No items found in the container.');
            return [];
        }
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error reading items: ${anyError.message}`);
        throw new Error(`Failed to read items from Cosmos DB: ${anyError.message}`);
    }
};

// update
export const updateItemInCosmosDB = async (uuid: string, updatedData: any) => {
    const container = client.database(databaseId).container(containerId);
    try {

        const querySpec = `SELECT * FROM c WHERE c.id = "${uuid}"`
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        if (items.length === 0) {
            console.log('No item found with the given uuid.');
            // アイテムが見つからなかった場合、新しいアイテムを保存
            return await saveToCosmosDB(updatedData);
        }

        const item = items[0];
        const { id, _etag } = item;

        // アイテムを更新
        const { resource: updatedItem } = await container.item(uuid, undefined).replace(updatedData);
        console.log("updated",updatedItem)
        // console.log(`Item updated:\n${JSON.stringify(updatedItem, null, 2)}`);

        return updatedItem;
    } catch (error) {
        const anyError = error as any;
        console.error(`Error updating item: ${anyError.message}`);
        throw new Error(`Failed to update item in Cosmos DB: ${anyError.message}`);
    }
};